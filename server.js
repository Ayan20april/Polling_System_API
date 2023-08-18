const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Database connection
const url = 'mongodb://localhost:27017';
const dbName = 'polling_system';

let db;

MongoClient.connect(url, (err, client) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to database');
  db = client.db(dbName);
});

// API routes
app.post('/polls', (req, res) => {
  const { question, options } = req.body;
  const poll = { question, options, votes: {} };

  db.collection('polls').insertOne(poll, (err, result) => {
    if (err) {
      console.error('Error creating poll:', err);
      res.status(500).send('Internal Server Error');
      return;
    }
    res.status(201).json({ message: 'Poll created successfully', pollId: result.insertedId });
  });
});

app.post('/polls/:id/vote', (req, res) => {
  const pollId = req.params.id;
  const { option } = req.body;

  db.collection('polls').findOne({ _id: ObjectId(pollId) }, (err, poll) => {
    if (err) {
      console.error('Error finding poll:', err);
      res.status(500).send('Internal Server Error');
      return;
    }
    if (!poll) {
      res.status(404).send('Poll not found');
      return;
    }
    if (!poll.votes[option]) {
      poll.votes[option] = 1;
    } else {
      poll.votes[option]++;
    }

    db.collection('polls').updateOne(
      { _id: ObjectId(pollId) },
      { $set: { votes: poll.votes } },
      (err) => {
        if (err) {
          console.error('Error updating poll:', err);
          res.status(500).send('Internal Server Error');
          return;
        }
        res.json({ message: 'Vote submitted successfully' });
      }
    );
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
