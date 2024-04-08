/**
 * Router handling product-related API endpoints.
 * @module productRouter
 */

import express from 'express'
import { Product, Bid, User } from '../orm/index.js'
import authMiddleware from '../middlewares/auth.js'
import { getDetails } from '../validators/index.js'

const router = express.Router()

/**
 * Retrieves all products with associated bids and sellers.
 * @name GET/api/products
 * @function
 * @memberof module:productRouter
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next function.
 * @returns {JSON} JSON response containing the list of products.
 */
router.get('/api/products', async (req, res, next) => {
  try {
    const products = await Product.findAll({
      include: [{
        model: Bid,
        as: 'bids'
      },
      {
        model: User,
        as: 'seller'
      }
      ]
    })
    res.status(200).json(products)
  } catch (error) {
    console.error('Erreur lors de la récupération des produits :', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des produits' })
  }
})

/**
 * Retrieves a specific product with associated bids and seller.
 * @name GET/api/products/:productId
 * @function
 * @memberof module:productRouter
 * @param {string} req.params.productId - The ID of the product to retrieve.
 * @param {object} res - Express response object.
 * @returns {JSON} JSON response containing the requested product.
 */
router.get('/api/products/:productId', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.productId, {
      include: [{
        model: User,
        as: 'seller'
      }, {
        model: Bid,
        as: 'bids',
        include: {
          model: User,
          as: 'bidder'
        }
      }]
    })
    if (!product) {
      res.status(404).json({ error: 'Product not found' })
    } else {
      res.status(200).json(product)
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * Creates a new product.
 * @name POST/api/products
 * @function
 * @memberof module:productRouter
 * @param {string} req.body.name - The name of the product.
 * @param {string} req.body.description - The description of the product.
 * @param {string} req.body.pictureUrl - The URL of the product picture.
 * @param {string} req.body.category - The category of the product.
 * @param {number} req.body.originalPrice - The original price of the product.
 * @param {Date} req.body.endDate - The end date of the product auction.
 * @param {object} req.user - User object containing ID.
 * @param {object} res - Express response object.
 * @returns {JSON} JSON response containing the newly created product.
 */
router.post('/api/products', authMiddleware, async (req, res) => {
  const { name, description, pictureUrl, category, originalPrice, endDate } = req.body

  try {
    const product = await Product.create({
      name,
      description,
      pictureUrl,
      category,
      originalPrice,
      endDate,
      sellerId: req.user.id
    })

    res.status(201).json(product)
  } catch (e) {
    res.status(400).json({
      error: 'Invalid or missing fields',
      details: getDetails(e)
    })
  }
})

/**
 * Updates an existing product.
 * @name PUT/api/products/:productId
 * @function
 * @memberof module:productRouter
 * @param {string} req.params.productId - The ID of the product to update.
 * @param {string} req.body.name - The updated name of the product.
 * @param {string} req.body.description - The updated description of the product.
 * @param {string} req.body.pictureUrl - The updated URL of the product picture.
 * @param {string} req.body.category - The updated category of the product.
 * @param {number} req.body.originalPrice - The updated original price of the product.
 * @param {Date} req.body.endDate - The updated end date of the product auction.
 * @param {object} req.user - User object containing ID.
 * @param {object} res - Express response object.
 * @returns {JSON} JSON response containing the updated product.
 */
router.put('/api/products/:productId', authMiddleware, async (req, res) => {
  const { productId } = req.params
  const { name, description, pictureUrl, category, originalPrice, endDate } = req.body

  const product = await Product.findByPk(productId)

  if (!product) {
    res.status(404).json({
      error: 'Product not found'
    })
    return
  }

  if (product.sellerId != req.user.id && !req.user.admin) {
    res.status(403).json({
      error: 'User not granted'
    })
    return
  }

  try {
    const updatedProduct = await product.update({
      name,
      description,
      pictureUrl,
      category,
      originalPrice,
      endDate
    })

    const response = updatedProduct.toJSON()
    delete response.createdAt
    delete response.updatedAt

    res.status(200).json(response)
  } catch (e) {
    res.status(400).json({
      error: 'Invalid or missing fields',
      details: getDetails(e)
    })
  }
})

/**
 * Deletes a product with the specified ID.
 * @name DELETE/api/products/:productId
 * @function
 * @memberof module:productRouter
 * @param {string} req.params.productId - The ID of the product to delete.
 * @param {object} req.user - User object containing ID.
 * @param {object} res - Express response object.
 * @returns {JSON} JSON response indicating success or failure.
 */
router.delete('/api/products/:productId', authMiddleware, async (req, res) => {
  try {
    const productId = req.params.productId
    const product = await Product.findByPk(productId)

    if (!product) {
      res.status(404).json({
        error: 'Product not found'
      })
      return
    }

    if ((product.sellerId !== req.user.id) && !req.user.admin) {
      res.status(403).json({
        error: 'User not granted'
      })
      return
    }

    await product.destroy()

    return res.status(204).send()
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

export default router
