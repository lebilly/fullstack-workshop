'use strict';

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
var router = express.Router();

const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
const assert = require('assert');
const url = 'mongodb://localhost:27017';

MongoClient.connect(url, (err, client) => {
  assert.equal(null, err);
  console.log(`Successfully connected to ${url}`);
  const collection = client.db('todoApp').collection('todoItem');

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept'
    );
    next();
  });

  router.route('/').get((req, res) => {
    collection.find({}).toArray((err, docs) => {
      assert.equal(null, err);

      return res.status(200).json(docs);
    });
  });

  router.route('/').post((req, res) => {
    const todoItem = req.body;

    collection.insert(todoItem, (err, result) => {
      assert.equal(null, err);

      console.log(`The todo item: ${todoItem.title} was successfully created.`);

      return res.status(200).json(todoItem);
    });
  });

  router.route('/:itemId').put((req, res) => {
    const itemId = req.params.itemId;
    const todoItem = req.body;
    collection.findOneAndUpdate(
      {
        _id: ObjectId(itemId)
      },
      {
        $set: {
          title: todoItem.title,
          completed: todoItem.completed
        }
      },
      {
        returnNewDocument: true
      },
      (err, doc) => {
        assert.equal(null, err);

        if (!doc.lastErrorObject.updatedExisting) {
          console.log('The todo item does not exist');
          return res.sendStatus(400);
        }

        const result = JSON.parse(JSON.stringify(doc));
        console.log(
          `The todo item: ${result.value.title} was successfully updated.`
        );
        return res.sendStatus(200);
      }
    );
  });

  router.route('/:itemId').delete((req, res) => {
    const itemId = req.params.itemId;

    collection.findOneAndDelete(
      {
        _id: ObjectId(itemId)
      },
      (err, doc) => {
        assert.equal(null, err);

        const result = JSON.parse(JSON.stringify(doc));

        if (!result.value) {
          console.log('The todo item does not exist');
          return res.sendStatus(400);
        }

        console.log(
          `The todo item: ${result.value.title} was successfully deleted.`
        );

        return res.sendStatus(200);
      }
    );
  });

  app.use('/api', router);

  app.listen(3001, () => {
    console.log('The server is listening on PORT 3001');
  });
});
