/**
 * Router handling user-related API endpoints.
 * @module userRouter
 */

import express from 'express'
import { User, Product, Bid } from '../orm/index.js'

const router = express.Router()

/**
 * Retrieves a user with associated products and bids.
 * @name GET/api/users/:userId
 * @function
 * @memberof module:userRouter
 * @param {string} req.params.userId - The ID of the user to retrieve.
 * @param {object} res - Express response object.
 * @returns {JSON} JSON response containing the requested user.
 */
router.get('/api/users/:userId', async (req, res) => {
  try {
    const userId = req.params.userId
    const user = await User.findOne({
      include: [
        {
          model: Product,
          as: 'products'
        },
        {
          model: Bid,
          as: 'bids',
          include: 'product'
        }
      ],
      where: {
        id: userId
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    res.status(200).json(user)
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur :', error)
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'utilisateur' })
  }
})

export default router
