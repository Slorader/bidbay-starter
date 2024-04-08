/**
 * Router handling bid-related API endpoints.
 * @module bidRouter
 */

import authMiddleware from '../middlewares/auth.js'
import { Bid, Product } from '../orm/index.js'
import express from 'express'
import { getDetails } from '../validators/index.js'

const router = express.Router()

/**
 * Deletes a bid with the specified ID.
 * @name DELETE/api/bids/:bidId
 * @function
 * @memberof module:bidRouter
 * @param {string} req.params.bidId - The ID of the bid to be deleted.
 * @param {object} req.user - User object containing ID and admin status.
 * @param {object} res - Express response object.
 * @returns {JSON} JSON response indicating success or failure.
 */
router.delete('/api/bids/:bidId', authMiddleware, async (req, res) => {
  try {
    const bid = await Bid.findByPk(req.params.bidId)

    if (!bid) {
      return res.status(404).json({
        error: 'Bid not found'
      })
    }

    if (bid.bidderId !== req.user.id && !req.user.admin) {
      return res.status(403).json({ message: 'Action non autorisée' })
    }
    await bid.destroy()
    res.status(204).send()
  } catch (err) {
    res.status(401).json({ message: err.message })
  }
})

/**
 * Creates a new bid for the specified product.
 * @name POST/api/products/:productId/bids
 * @function
 * @memberof module:bidRouter
 * @param {number} req.body.price - The amount of the bid.
 * @param {number} req.user.id - ID of the user placing the bid.
 * @param {string} req.params.productId - ID of the product for which the bid is being placed.
 * @param {object} res - Express response object.
 * @returns {JSON} JSON response containing the newly created bid.
 */
router.post('/api/products/:productId/bids', authMiddleware, async (req, res) => {
  try {
    const bidAmount = req.body.price
    const userId = req.user.id
    const productId = req.params.productId

    if (!bidAmount || !userId || !productId) {
      return res.status(400).json({ error: 'Invalid or missing fields', details: 'Some fields are missing or invalid' })
    }

    const bid = await Bid.create({
      productId,
      bidderId: userId,
      price: bidAmount,
      date: new Date(Date.now())
    })

    return res.status(201).json(bid)
  } catch (error) {
    console.error(error)
    return res.status(400).json({ error: 'An error occurred' })
  }
})

export default router
