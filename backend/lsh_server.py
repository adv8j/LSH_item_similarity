import zlib
import random
from flask import Flask, request, jsonify
import pandas as pd
import re
import random
from collections import defaultdict
from tqdm import tqdm
import time
import html
from flask_cors import CORS

# Data Loading and Preprocessing
def load_data(file_path):
    print(f"Loading data from {file_path}...")

    return pd.read_json(file_path, lines=True)

def preprocess_text(text):

    if not isinstance(text, str):
        return ""
    # text = re.sub('<[^<]+?>', ' ', text)
    text = html.unescape(text)

    # Convert to lowercase
    text = text.replace('\\"', ' ')
    text = text.lower()
    # Remove punctuation and non-alphanumeric characters
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    # Replace multiple spaces with a single space
    text = re.sub(r'\s+', ' ', text).strip()
    return text

class LSHFinder:
    def __init__(self, products_df, num_hashes=100, k_shingle=5, bands=20, seed=42):
        
        self.products_df = products_df.copy()
        self.num_hashes = num_hashes
        self.k_shingle = k_shingle
        self.bands = bands
        self.rows_per_band = num_hashes // bands
        
        self.asin_to_idx = {asin: i for i, asin in enumerate(self.products_df['asin'])}
        self.idx_to_asin = {i: asin for asin, i in self.asin_to_idx.items()}
        # print("DEBUG: len of asin_to_idx: ",len(self.asin_to_idx), " and idx_to_asin: ",len(self.idx_to_asin))
        # print(self.asin_to_idx["B00002N5EL"])
        # print(self.idx_to_asin[4])
        random.seed(seed)
        self.large_prime = 4294967311  # prime > 2^32
        self.shingles = {}             # will store shingles by index
        self.signatures = None
        self.lsh_buckets = defaultdict(set)
        self._generate_hash_functions()

    # seeded 
    def _generate_hash_functions(self):
        self.hash_funcs = []
        for _ in range(self.num_hashes):
            a = random.randint(1, self.large_prime - 1)
            b = random.randint(0, self.large_prime - 1)
            # keep a,b captured as defaults
            self.hash_funcs.append(lambda x, a=a, b=b, p=self.large_prime: (a * (x & 0xffffffff) + b) % p)


    def _create_shingles(self, text):
        if not isinstance(text, str) or text == "":
            return set()
        s = set()
        if len(text) < self.k_shingle:

            s.add(zlib.crc32(text.encode('utf8')) & 0xffffffff) # so that it is positive
            return s
        for i in range(len(text) - self.k_shingle + 1):
            sh = text[i:i+self.k_shingle]
            s.add(zlib.crc32(sh.encode('utf8')) & 0xffffffff) # so that it is positive
        return s

    def _build_minhash_signatures(self, field_name):
        num_products = len(self.products_df)
        self.signatures = [[None] * num_products for _ in range(self.num_hashes)]
        for idx in tqdm(range(num_products), total=num_products,desc="Shingling & Hashing"):
            row = self.products_df.iloc[idx]
            text = row[field_name]
            product_shingles = self._create_shingles(text)
            self.shingles[idx] = product_shingles
            if not product_shingles:
                continue
            for sh in product_shingles:
                for i, hf in enumerate(self.hash_funcs):
                    hval = hf(sh)
                    cur = self.signatures[i][idx]
                    if cur is None or hval < cur:
                        self.signatures[i][idx] = hval

    def _build_lsh(self):
        if self.signatures is None:
            raise ValueError("build signatures first")
        num_products = len(self.products_df)
        for b in tqdm(range(self.bands), desc="Banding"):
            start = b * self.rows_per_band
            end = start + self.rows_per_band
            for prod_idx in range(num_products):
                band_vals = tuple(self.signatures[i][prod_idx] for i in range(start, end))
                if any(v is None for v in band_vals):
                    continue
                bucket_key = (b, band_vals)   # exact tuple as key
                self.lsh_buckets[bucket_key].add(prod_idx)

    # MinHash Jaccard estimator
    def _estimate_jaccard(self, sig1, sig2):
        valid = 0
        matches = 0
        for a, b in zip(sig1, sig2):
            if a is None or b is None:
                continue
            valid += 1
            if a == b:
                matches += 1
        if valid == 0:
            return 0.0
        return matches / valid

    # get candidates via LSH, then compute exact Jaccard on stored shingles for ranking
    def find_similar(self, asin, top_n=10):
        if asin not in self.asin_to_idx:
            return []
        qidx = self.asin_to_idx[asin]
        query_sig = [self.signatures[i][qidx] for i in range(self.num_hashes)]
        candidates = set()
        for b in range(self.bands):
            start = b * self.rows_per_band
            end = start + self.rows_per_band
            band_sig = tuple(self.signatures[i][qidx] for i in range(start, end))
            if any(v is None for v in band_sig):
                continue
            bucket_key = (b, band_sig)
            candidates.update(self.lsh_buckets.get(bucket_key, set()))
        candidates.discard(qidx)

        q_sh = self.shingles.get(qidx, set())
        sims = []
        for c in candidates:
            c_sh = self.shingles.get(c, set())
            if not q_sh or not c_sh:
                continue
            exact_j = len(q_sh & c_sh) / len(q_sh | c_sh)
            if exact_j > 0:
                sims.append((self.idx_to_asin[c], exact_j))
        sims.sort(key=lambda x: x[1], reverse=True)

        print("DEBUG: All similar products: \n","Length: ",len(sims),"\n",sims)
        return sims[:top_n]

    def fit(self, field_name):
        start_time = time.time()
        self._build_minhash_signatures(field_name)
        self._build_lsh()
        end_time = time.time()
        print(f"LSH model built in {end_time - start_time:.2f} seconds.")


if __name__ == "__main__":
    app = Flask(__name__)  
    CORS(app) # allow all origins 
    DATA_FILE = '../data/meta_Appliances.json'
    df = pd.read_json(DATA_FILE, lines=True)
    df = df[['description', 'title', 'asin', 'similar_item', 'also_buy', 'also_view']]
    df = df.drop_duplicates(subset='asin').reset_index(drop=True)

    # Fix empty description
    df.loc[df['description'].apply(lambda x: x == []), 'description'] = df['title']
    df = df.astype(str).reset_index(drop=True)

    # Preprocess
    df['clean_title'] = df['title'].apply(preprocess_text)
    df['clean_description'] = df['description'].apply(preprocess_text)
    df['pstd_hybrid'] = (df['clean_title'] + ' ') * 3 + df['clean_description']

    # Build LSH models
    lsh_models = {
        "pst": LSHFinder(products_df=df, num_hashes=120, k_shingle=7, bands=30),
        "psd": LSHFinder(products_df=df, num_hashes=120, k_shingle=7, bands=30),
        "pstd": LSHFinder(products_df=df, num_hashes=120, k_shingle=7, bands=30)
    }
    lsh_models["pst"].fit("clean_title")
    lsh_models["psd"].fit("clean_description")
    lsh_models["pstd"].fit("pstd_hybrid")

    # api endpoint
    @app.route("/api/similar", methods=["POST"])
    def find_similar():
        payload = request.get_json()

        mode = payload.get("mode")
        product_id = payload.get("product_id")
        method = payload.get("method")
        k = payload.get("k", 10)

        if method not in lsh_models:
            return jsonify({"error": "Invalid method"}), 400

        if mode != "by_id":
            return jsonify({"error": "Only mode=by_id is supported"}), 400

        if product_id not in df["asin"].values:
            return jsonify({"error": "Product not found"}), 404

        model = lsh_models[method]
        similar_items = model.find_similar(product_id, top_n=k)

        # Only return ASIN IDs
        results = [asin for asin, sim in similar_items]

        return jsonify({"results": results})
    app.run(host="0.0.0.0", port=5000, debug=False)