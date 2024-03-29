import authMiddleware from '../middlewares/auth.js'
import { Bid, Product } from '../orm/index.js'
import express from 'express'
import { getDetails } from '../validators/index.js'

const router = express.Router()

router.delete('/api/bids/:bidId', async (req, res) => {
  try {
    const bidId = req.params.bidId // Utilisez le bon paramètre de l'URL
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

router.post('/api/products/:productId/bids', async (req, res) => {
  res.status(600).send()
})

export default router
