import express from 'express';
import fetch from 'node-fetch';
import _ from 'lodash';
import memoize from 'memoizee';

const app = express();
const port = process.env.PORT || 3000;

let blogData; // Variable to store fetched blog data

// Middleware to fetch blog data
app.get('/api/blog-stats', async (req, res, next) => {
  try {
    if (!blogData) {
      blogData = await fetchBlogData();
    }
    const analytics = analyzeBlogData(blogData);
    res.json(analytics);
  } catch (error) {
    next(error);
  }
});

// Middleware to search blogs
app.get('/api/blog-search', (req, res, next) => {
  const query = req.query.query;
  const filteredBlogs = searchBlogs(query);
  res.json(filteredBlogs);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Function to fetch blog data from the third-party API
const fetchBlogData = async () => {
  const url = 'https://intent-kit-16.hasura.app/api/rest/blogs';
  const headers = {
    'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6'
  };

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error('Failed to fetch blog data');
  }

  return response.json();
};

// Function to analyze blog data using Lodash
const analyzeBlogData = (blogData) => {
  const totalBlogs = blogData.length;
  const longestBlog = _.maxBy(blogData, 'title.length');
  const blogsWithPrivacy = _.filter(blogData, (blog) => _.includes(blog.title.toLowerCase(), 'privacy'));
  const uniqueBlogTitles = _.uniqBy(blogData, 'title');

  return {
    totalBlogs,
    longestBlog: longestBlog.title,
    blogsWithPrivacy: blogsWithPrivacy.length,
    uniqueBlogTitles: uniqueBlogTitles.map((blog) => blog.title),
  };
};

// Function to search blogs based on a query string
const searchBlogs = (query) => {
  const sanitizedQuery = query.toLowerCase();
  const filteredBlogs = _.filter(blogData, (blog) => _.includes(blog.title.toLowerCase(), sanitizedQuery));
  return filteredBlogs;
};

// Caching using memoizee
const memoizedFetchBlogData = memoize(fetchBlogData, { maxAge: 60000 }); // Cache for 1 minute

// Clear the cache if needed
const clearBlogDataCache = () => {
  memoizedFetchBlogData.clear();
};

// Cron job to clear the cache daily (optional)
setInterval(clearBlogDataCache, 86400000); // 24 hours in milliseconds
