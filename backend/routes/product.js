import express from 'express'
import { Product, Bid, User } from '../orm/index.js'
import authMiddleware from '../middlewares/auth.js'
import { getDetails } from '../validators/index.js'

const router = express.Router()

router.get('/api/products', async (req, res, next) => {
  res.status(600).send()
})

router.get('/api/products/:productId', async (req, res) => {
  const { productId } = req.params

  try {
    const product = await Product.findOne({
      where: { id: productId }
    })

    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' })
    }

    res.status(200).json(product)
  } catch (e) {
    console.log(e)
    res.status(500)
  }
})

// You can use the authMiddleware with req.user.id to authenticate your endpoint ;)

router.post('/api/products', (req, res) => {
  res.status(600).send()
})

router.put('/api/products/:productId', async (req, res) => {
  res.status(600).send()
})

router.delete('/api/products/:productId', async (req, res) => {
  res.status(600).send()
})

export default router
