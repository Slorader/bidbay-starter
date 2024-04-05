import express from 'express'
import { User, Product, Bid } from '../orm/index.js'

const router = express.Router()

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
          as: 'bids'
        }
      ],
      where: {
        id: userId
      }
    })
    res.status(200).json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur :', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'utilisateur' });
  }
})

export default router
