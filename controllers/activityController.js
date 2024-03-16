const Activity = require('../models/activity.model');

async function getAll(req, res) {
    try {
        const activities = await Activity.find();
        res.status(200).json(activities);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function create(req, res) {
    const { image, title, place, price, category: categoryId, minPeople, description, date } = req.body;
    if(!image || !title || !place || !price || !categoryId || !minPeople || !description || !date) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    const activityDate = new Date(date);
    if(activityDate.getTime() < Date.now()) {
        return res.status(400).json({ message: 'Date must be in the future' });
    }
    try {
        const result = await Activity.create({
            image: image,
            title: title,
            place: place,
            price: price,
            category: categoryId,
            minPeople: minPeople,
            description: description,
            date: activityDate,
        });
        res.status(201).json({ message: 'Activity created'});
    } catch (error) {
        console.log(error);
        res.status(400).json({ message: error.message });
    }
}

async function getOne(req, res) {
    const id = req.params.id;
    try {
        const activity = await Activity.findById(id);
        if(!activity) {
            return res.status(404).json({ message: 'Activity not found' });
        }
        res.status(200).json(activity);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function update(req, res) {
    const id = req.params.id;
    const { image, title, place, price, category: categoryId, minPeople, description, date } = req.body;
    if(!image || !title || !place || !price || !categoryId || !minPeople || !description || !date) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    let editDate = date.split('T')[0];
    const activityDate = new Date(editDate + 'T00:00:00Z');
    if(activityDate.getTime() < Date.now()) {
        return res.status(400).json({ message: 'Date must be in the future' });
    }
    try {
        const activity = await Activity.findByIdAndUpdate(id, {
            image: image,
            title: title,
            place: place,
            price: price,
            category: categoryId,
            minPeople: minPeople,
            description: description,
            date: activityDate
        });
        if(!activity) {
            return res.status(404).json({ message: 'Activity not found' });
        }
        res.status(200).json({ message: 'Activity updated'});
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function remove(req, res) {
    const id = req.params.id;
    try {
        const activity = await Activity.findByIdAndDelete(id);
        if(!activity) {
            return res.status(404).json({ message: 'Activity not found' });
        }
        res.status(200).json({ message: 'Activity deleted', activity: activity });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

module.exports = { getAll, create, getOne, update, remove }

