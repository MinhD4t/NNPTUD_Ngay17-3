var express = require('express');
var router = express.Router();
let inventoryModel = require('../schemas/inventories');

// 1. Get all inventory (có populate product)
router.get('/', async function (req, res) {
    try {
        let result = await inventoryModel.find().populate('product');
        res.send(result);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// 2. Get inventory by ID (có populate product)
router.get('/:id', async function (req, res) {
    try {
        let result = await inventoryModel.findById(req.params.id).populate('product');
        if (result) {
            res.send(result);
        } else {
            res.status(404).send({ message: "ID NOT FOUND" });
        }
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});

// 3. Add Stock
router.post('/add-stock', async function (req, res) {
    try {
        const { product, quantity } = req.body;
        let inv = await inventoryModel.findOne({ product: product });
        if (!inv) return res.status(404).send({ message: "Inventory not found for this product" });

        inv.stock += Number(quantity);
        await inv.save();
        res.send(inv);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// 4. Remove Stock
router.post('/remove-stock', async function (req, res) {
    try {
        const { product, quantity } = req.body;
        let inv = await inventoryModel.findOne({ product: product });
        if (!inv) return res.status(404).send({ message: "Inventory not found" });

        if (inv.stock < quantity) {
            return res.status(400).send({ message: "Not enough stock" });
        }

        inv.stock -= Number(quantity);
        await inv.save();
        res.send(inv);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// 5. Reservation (giảm stock, tăng reserved)
router.post('/reserve', async function (req, res) {
    try {
        const { product, quantity } = req.body;
        let inv = await inventoryModel.findOne({ product: product });
        if (!inv) return res.status(404).send({ message: "Inventory not found" });

        if (inv.stock < quantity) {
            return res.status(400).send({ message: "Not enough stock to reserve" });
        }

        inv.stock -= Number(quantity);
        inv.reserved += Number(quantity);
        await inv.save();
        res.send(inv);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// 6. Sold (giảm reserved, tăng soldCount)
router.post('/sold', async function (req, res) {
    try {
        const { product, quantity } = req.body;
        let inv = await inventoryModel.findOne({ product: product });
        if (!inv) return res.status(404).send({ message: "Inventory not found" });

        if (inv.reserved < quantity) {
            return res.status(400).send({ message: "Not enough reserved items to sell" });
        }

        inv.reserved -= Number(quantity);
        inv.soldCount += Number(quantity);
        await inv.save();
        res.send(inv);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

module.exports = router;
