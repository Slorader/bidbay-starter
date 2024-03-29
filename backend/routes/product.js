import express from 'express'
import { Product, Bid, User } from '../orm/index.js'
import authMiddleware from '../middlewares/auth.js'
import { getDetails } from '../validators/index.js'

const router = express.Router()

router.get('/api/products', async (req, res, next) => {
  try {
    const products = await Product.findAll({
      include: [{
        model: User,
        as: 'seller'
      }]
    })
    res.status(200).json(products)
  } catch (error) {
    console.error('Erreur lors de la récupération des produits :', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des produits' })
  }
})

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

// You can use the authMiddleware with req.user.id to authenticate your endpoint ;)

router.post('/api/products', authMiddleware, async (req, res) => {

  const { name, description, pictureUrl, category, originalPrice, endDate } = req.body;

  try {
    let product = await Product.create({
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
      'error': 'Invalid or missing fields',
      'details': getDetails(e)
    })
  }
})

router.put('/api/products/:productId', async (req, res) => {
  res.status(600).send()
})

router.delete('/api/products/:productId', async (req, res) => {
  res.status(600).send()
})

export default router
