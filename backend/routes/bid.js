import authMiddleware from '../middlewares/auth.js'
import { Bid, Product } from '../orm/index.js'
import express from 'express'
import { getDetails } from '../validators/index.js'

const router = express.Router()

router.delete('/api/bids/:bidId', async (req, res) => {
  try {
    const bidId = req.params.bidId
    const bid = await Bid.findByPk(bidId)

    if (!bid) {
      return res.status(404).json({
        error: 'Bid not found'
      })
    }

    await bid.destroy()

    return res.status(204).send()
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

router.post('/api/products/:productId/bids', authMiddleware, async (req, res) => {
  try {
    const bidAmount = req.body.bidAmount
    const userId = req.body.userId
    const productId = req.body.productId

    if (!bidAmount || !userId || !productId) {
      return res.status(400).json({ error: 'Missing parameters' })
    }

    const bid = await Bid.create({
      productId,
      bidderId: userId,
      price: bidAmount,
      date: new Date(Date.now())
    })

    return res.status(201).json({ bidAmount, userId, productId })
  } catch (error) {
    console.error(error)
    return res.status(400).json({ error: 'An error occurred' })
  }
})

export default router
