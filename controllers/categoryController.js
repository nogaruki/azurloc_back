const CategoryController = require('../models/category.model');
const Activity = require('../models/activity.model');

async function getAll(req, res) {
    try {
        const categories = await CategoryController.find();
        res.status(200).json(categories);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function create(req, res) {
    const { name, description } = req.body;
    if(!name || !description) {
        return res.status(400).json({ message: 'Name is required' });
    }

    try {
        const existingCategory = await CategoryController.findOne({ name: name });
        if(existingCategory) {
            return res.status(400).json({ message: 'CategoryController already exists' });
        }
        const newCategory = await CategoryController.create({ name: name, description: description});
        res.status(201).json({ message: 'CategoryController created', category: newCategory });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function getOne(req, res) {
    const id = req.params.id;
    try {
        const category = await CategoryController.findById(id);
        if(!category) {
            return res.status(404).json({ message: 'CategoryController not found' });
        }
        res.status(200).json(category);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function update(req, res) {
    const id = req.params.id;
    const { name, description } = req.body;
    if(!name || !description) {
        return res.status(400).json({ message: 'Please complete all fields' });
    }
    try {
        const category = await CategoryController.findByIdAndUpdate(id, { name: name, description: description}, { new: true });
        if(!category) {
            return res.status(404).json({ message: 'CategoryController not found' });
        }
        res.status(200).json({ message: 'CategoryController updated', category: category });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function remove(req, res) {
    const id = req.params.id;
    try {
        const category = await CategoryController.findByIdAndDelete(id);
        if(!category) {
            return res.status(404).json({ message: 'CategoryController not found' });
        }
        await Activity.deleteMany({ category: id });
        res.status(200).json({ message: 'CategoryController deleted' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

module.exports = { getAll, create, getOne, update,  remove };
