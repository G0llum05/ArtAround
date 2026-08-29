const express = require('express');
const UserController = require('./UserController');

const router = express.Router();

// GET all users
router.get('/', UserController.getAllUsers);

// GET user by ID
router.get('/:id', UserController.getUserById);

// CREATE a new user
router.post('/', UserController.createUser);

// UPDATE a user by ID (PATCH for partial update)
router.patch('/:id', UserController.updateUser);

// PURCHASE a visit
router.post('/:id/purchase-visit', UserController.purchaseVisit);
router.post('/purchase-visit', UserController.purchaseVisit);

// DELETE a user by ID
router.delete('/:id', UserController.deleteUser);

module.exports = router;
