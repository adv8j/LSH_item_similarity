### Question 1

1.  **Main Product Gallery Page (`/` or `/products`)**: This page will list all the products from the dataset.
    * **Product Cards**: Each product should be displayed in a "card." The card should show only essential info like the product **title** and maybe the first few lines of the **description**.
    * **Pagination**: Since there are over 30,000 products , must implement pagination. Don't try to load all products at once. Simple "Next" and "Previous" buttons at the bottom of the page will work fine.
    * **Click Action**: Clicking anywhere on a card should navigate the user to the specific detail page for that product (e.g., `/product/B00004WF4H`).

2.  **Product Detail Page (`/product/<asin-field>`)**: This is the page a user lands on after clicking a card.
    * It should display all the available information for that single product: title, description, and any other metadata (like similar_items, also_view, also_buy, etc.). Can discard certain fields if they don't make sense to show. Also, would add the search similar/find functionality here relevant for part 2.
    * Note that product detail page has complete details while the cards have only title, description, price (and maybe image?).

### Question 2

* **UI Component**: On the product detail page, add a new section called something like "Find Similar Products". 
* **User Selection**: This section must contain a way for the user to choose one of the three required similarity functions :
    1.  Products with similar **title** (PST) 
    2.  Products with similar **description** (PSD) 
    3.  Products with similar **title and description** (PSTD) 

    A dropdown menu would work.
    * **Displaying Results**: After the user selects an option and clicks a "Find" button, the backend will return a list of the top 5/10 items. The frontend should then display these results right there on the same page, perhaps below the "Find Similar Products" section. can reuse the same product card component from the main gallery page to display these results. Can assume the recv'd payload would have an array in the same format as given in the dataset.

### Summary of Frontend Flow

1.  **User lands on the Main Gallery Page (`/`)**. They see a paginated list of all appliance products.
2.  **User clicks on a product card** (e.g., "GE Dishwasher").
3.  **User is taken to the Product Detail Page (`/product/<asin-field>`)**. They see the full details of that dishwasher.
4.  **On this page, the user sees a "Find Similar Products" section**. They select "Similar by Title" from a dropdown and click "Find".
5.  **A list of the top 5-10 similar products appears** on the same page, each displayed in its own card.

### Dataset Fields

- asin - ID of the product, e.g. 0000031852
- title - name of the product
- feature - bullet-point format features of the product
- description - description of the product
- price - price in US dollars (at time of crawl)
- imageURL - url of the product image
- imageURL - url of the high resolution product image
- related - related products (also bought, also viewed, bought together, buy after viewing)
- salesRank - sales rank information
- brand - brand name
- categories - list of categories the product belongs to
- tech1 - the first technical detail table of the product
- tech2 - the second technical detail table of the product
- similar - similar product table