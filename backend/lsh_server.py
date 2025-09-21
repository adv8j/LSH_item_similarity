from flask import Flask, request, jsonify
import pandas as pd
import re
import random
from collections import defaultdict
from tqdm import tqdm
import time
import html

# --- 1. Data Loading and Preprocessing ---

def load_data(file_path):
    """Loads the Amazon Appliances metadata from the .json.gz file."""
    print(f"Loading data from {file_path}...")
    # The site provides code to help with loading the data [cite: 21]
    return pd.read_json(file_path, lines=True)

def preprocess_text(text):
    """
    Cleans text by removing HTML tags, converting to lowercase, 
    and removing non-alphanumeric characters.
    """
    if not isinstance(text, str):
        return ""
    # Strip HTML tags [cite: 23]
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

# --- 2. LSH Core Logic ---

class LSHFinder:
    """
    A class to find similar products using Locality-Sensitive Hashing.
    The overall goal is to use LSH to find similar products[cite: 5].
    """
    def __init__(self, products_df, num_hashes=100, k_shingle=5, bands=20):
        # Hyperparameters for evaluation are specified in the assignment [cite: 57, 58, 59]
        if num_hashes % bands != 0:
            raise ValueError("Number of hashes must be divisible by the number of bands.")
        
        self.products_df = products_df.copy()
        self.num_hashes = num_hashes
        self.k_shingle = k_shingle
        self.bands = bands
        self.rows_per_band = num_hashes // bands
        
        self.asin_to_idx = {asin: i for i, asin in enumerate(self.products_df['asin'])}
        self.idx_to_asin = {i: asin for asin, i in self.asin_to_idx.items()}
        print("DEBUG: len of asin_to_idx: ",len(self.asin_to_idx), " and idx_to_asin: ",len(self.idx_to_asin))
        print(self.asin_to_idx["B00002N5EL"])
        print(self.idx_to_asin[4])
        # Initialize internal data structures
        self.shingles = {}
        self.signatures = None
        self.lsh_buckets = defaultdict(set)
        
        self._generate_hash_functions()

    def _generate_hash_functions(self):
        """Creates a list of hash functions for MinHashing."""
        self.hash_funcs = []
        # A large prime number for the hash function domain
        large_prime = 4294967291 
        # large_prime = 2147483647 

        for _ in range(self.num_hashes):
            a = random.randint(1, large_prime - 1)
            b = random.randint(0, large_prime - 1)
            self.hash_funcs.append(lambda x, a=a, b=b, p=large_prime: (a * x + b) % p)

    def _create_shingles(self, text):
        """Creates a set of k-character shingles from a given text."""
        shingles = set()
        if len(text) < self.k_shingle:
            return shingles
        for i in range(len(text) - self.k_shingle + 1):
            shingle = text[i:i+self.k_shingle]
            # Hash the shingle to an integer to use with our hash functions
            shingles.add(hash(shingle))
        return shingles

    def _build_minhash_signatures(self, field_name):
        """Builds the MinHash signature matrix for a specified text field."""
        num_products = len(self.products_df)
        print(f"Building MinHash signatures for {num_products} products on field '{field_name}'...")
        
        # Initialize signature matrix with infinity
        self.signatures = [[float('inf')] * num_products for _ in range(self.num_hashes)]
        
        for idx, row in tqdm(self.products_df.iterrows(), total=num_products, desc="Shingling & Hashing"):
            text = row[field_name]
            # Create shingles for the current product's text
            product_shingles = self._create_shingles(text)
            if not product_shingles:
                continue

            # For each shingle, compute its hash values
            for shingle in product_shingles:
                for i, hash_func in enumerate(self.hash_funcs):
                    hash_val = hash_func(shingle)
                    # Update the signature if we found a smaller hash value
                    if hash_val < self.signatures[i][idx]:
                        self.signatures[i][idx] = hash_val
                        
    def _build_lsh(self):
        """Builds the LSH buckets for finding candidate pairs."""
        if self.signatures is None:
            raise ValueError("MinHash signatures must be built first.")
        
        print("Building LSH buckets...")
        num_products = len(self.products_df)
        
        for b in tqdm(range(self.bands), desc="Banding"):
            start_row = b * self.rows_per_band
            end_row = start_row + self.rows_per_band
            
            for prod_idx in range(num_products):
                # Extract the portion of the signature for the current band
                band_signature = tuple(self.signatures[i][prod_idx] for i in range(start_row, end_row))
                
                # Hash the band signature to a bucket key
                # We add the band index to the key to avoid collisions between bands
                bucket_key = (b, hash(band_signature))
                
                self.lsh_buckets[bucket_key].add(prod_idx)

    def fit(self, field_name):
        """Runs the full pipeline: MinHashing and LSH."""
        start_time = time.time()
        self._build_minhash_signatures(field_name)
        self._build_lsh()
        end_time = time.time()
        print(f"LSH model built in {end_time - start_time:.2f} seconds.")
    
    def _estimate_jaccard(self, sig1, sig2):
        """Estimates Jaccard similarity from two MinHash signatures."""
        # The signatures are columns, so we need to compare them element-wise
        matching_hashes = sum(s1 == s2 for s1, s2 in zip(sig1, sig2))
        return matching_hashes / self.num_hashes

    def find_similar(self, asin, top_n=10):
        """Finds top_n similar products for a given ASIN."""
        if asin not in self.asin_to_idx:
            return f"Product with ASIN '{asin}' not found."
            
        query_idx = self.asin_to_idx[asin]
        print("DEBUG: Query idx: ",query_idx," for ASIN: ",asin)
        query_signature = [self.signatures[i][query_idx] for i in range(self.num_hashes)]
        print("DEBUG: Query sign: \n",query_signature,"\n for ASIN: ",asin)
        # 1. Find candidate pairs using LSH buckets
        candidate_indices = set()
        for b in range(self.bands):
            start_row = b * self.rows_per_band
            end_row = start_row + self.rows_per_band
            band_signature = tuple(self.signatures[i][query_idx] for i in range(start_row, end_row))
            bucket_key = (b, hash(band_signature))
            
            # Add all products from the matching bucket as candidates
            candidates_in_bucket = self.lsh_buckets.get(bucket_key, set())
            candidate_indices.update(candidates_in_bucket)
            print("DEBUG: In the iter: Len of new cand: ",len(candidates_in_bucket), "total len: ",len(candidate_indices))
        print("DEBUG: Final Len of candidates: ",len(candidate_indices))
        # Remove the query product itself from candidates
        candidate_indices.discard(query_idx)
        
        # 2. Refine by calculating Jaccard similarity for candidates only
        similarities = []
        for candidate_idx in candidate_indices:
            candidate_signature = [self.signatures[i][candidate_idx] for i in range(self.num_hashes)]
            similarity = self._estimate_jaccard(query_signature, candidate_signature)
            if similarity > 0: # Only consider items with some similarity
                # print("DEBUG: len of asin_to_idx: ",len(self.asin_to_idx), " and idx_to_asin: ",len(self.idx_to_asin))
                # print("First 10 keys using a for loop:")
                # count = 0
                # for key in self.idx_to_asin.keys():
                #     if count >= 10:
                #         break
                #     print(key)
                #     count += 1


                similarities.append((self.idx_to_asin[candidate_idx], similarity))

        # 3. Sort by similarity and return top N
        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:top_n]




# -----------------------------
# 3. Run the app
# -----------------------------
if __name__ == "__main__":
    app = Flask(__name__)   
    # -----------------------------
    # 1. Load Data & Build Models
    # -----------------------------
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
    df['pstd_hybrid'] = (df['clean_title'] + ' ') * 5 + df['clean_description']

    # Build LSH models
    lsh_models = {
        "pst": LSHFinder(products_df=df, num_hashes=30, k_shingle=3, bands=15),
        "psd": LSHFinder(products_df=df, num_hashes=30, k_shingle=3, bands=15),
        "pstd": LSHFinder(products_df=df, num_hashes=30, k_shingle=3, bands=15)
    }
    lsh_models["pst"].fit("clean_title")
    lsh_models["psd"].fit("clean_description")
    lsh_models["pstd"].fit("pstd_hybrid")

    # -----------------------------
    # 2. API Endpoint
    # -----------------------------
    @app.route("/api/similar", methods=["POST"])
    def find_similar():
        print("here ")
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
    app.run(host="0.0.0.0", port=5000, debug=True)