# E-commerce Website - Backend

This repository contains the backend code for a fully functional e-commerce website developed using Node.js and Express.js. This API supports the frontend application in providing online shopping capabilities for computers and computer components.

**Key Features:**

* User authentication and authorization (integrated with Google OAuth 2.0).
* API endpoints for managing products (CRUD operations, search, filtering, sorting).
* Shopping cart and checkout functionalities.
* Order processing and management.
* Integration with the GHN API for shipping fee calculation based on geographical distance.
* Admin functionalities for managing products, users, and orders.
* Efficient image handling using AWS S3 and CDN.

**Technologies Used:**

* Node.js
* Express.js
* MongoDB
* Mongoose (hoặc thư viện ODM khác)
* Google OAuth 2.0
* GHN API
* AWS SDK (for S3 and CDN)

**Frontend Repository:**

The frontend application that consumes this API can be found at: [github.com/long-vux/e-commerce-node-frontend]

**Installation and Running:**

1.  Clone this repository:
    ```bash
    git clone github.com/long-vux/e-commerce-node-backend
    cd your-backend-repo
    ```
2.  Install dependencies:
    ```bash
    npm install
    # hoặc yarn install
    ```
3.  Configure environment variables:
    * Create a `.env` file in the root directory.
    * Add necessary environment variables, such as database connection string, Google OAuth credentials, GHN API key, AWS S3 credentials, etc. Example:
        ```
        MONGODB_URI=mongodb://localhost:27017/ecommerce
        GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
        GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
        GHN_API_KEY=YOUR_GHN_API_KEY
        AWS_S3_BUCKET_NAME=your-s3-bucket-name
        AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
        AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
        ```
4.  Start the backend server:
    ```bash
    npm start
    # hoặc npm run dev (nếu bạn sử dụng nodemon)
    # hoặc yarn start
    # hoặc yarn dev
    ```
    The backend API will be running on the port specified in your configuration (e.g., `http://localhost:5000`).
