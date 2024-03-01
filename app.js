const express = require('express');
const app = express();
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

app.use(express.json());

const dbPath = path.join(__dirname, 'covid19India.db');
let db = null;

const initializeDatabaseAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    app.listen(3000, () => {
      console.log('Server started at https://chettayaakashqhyvpnjscpdiitb.drops.nxtwave.tech');
    });
  } catch (e) {
    console.log(`Database Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDatabaseAndServer();

// Define GET endpoint for /states/
app.get('/states/', async (req, res) => {
  try {
    const getStatesQuery = `
      SELECT state_id AS stateId, state_name AS stateName, population
      FROM state;
    `;
    const databaseResponse = await db.all(getStatesQuery);
    res.json(databaseResponse);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get State Info By Id API
app.get('/states/:stateId', async (req, res) => {
  const { stateId } = req.params;
  try {
    const getStateQuery = `
      SELECT state_id AS stateId, state_name AS stateName, population
      FROM state
      WHERE state_id = ?;
    `;
    const databaseResponse = await db.get(getStateQuery, [stateId]);
    res.json(databaseResponse);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST district data API
app.post('/districts/', async (req, res) => {
  const districtDetails = req.body;
  const { districtName, stateId, cases, cured, active, deaths } = districtDetails;
  try {
    const addDistrictQuery = `
      INSERT INTO district(district_name, state_id, cases, cured, active, deaths)
      VALUES (?, ?, ?, ?, ?, ?);
    `;
    await db.run(addDistrictQuery, [districtName, stateId, cases, cured, active, deaths]);
    res.send('District Successfully Added');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Internal Server Error');
  }
});

// Get district details by id API
app.get('/districts/:districtId', async (req, res) => {
  const { districtId } = req.params;
  try {
    const getDistrictQuery = `
      SELECT district_id AS districtId, district_name AS districtName, state_id AS stateId, cases, cured, active, deaths
      FROM district
      WHERE district_id = ?;
    `;
    const dbResponse = await db.get(getDistrictQuery, [districtId]);
    res.json(dbResponse);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Internal Server Error');
  }
});

// Delete district data by Id API
app.delete('/districts/:districtId', async (req, res) => {
  const { districtId } = req.params;
  try {
    const deleteDistrictQuery = `
      DELETE FROM district
      WHERE district_id = ?;
    `;
    await db.run(deleteDistrictQuery, [districtId]);
    res.send('District Removed');
  } catch (e) {
    console.error(e.message);
    res.status(500).send('Internal Server Error');
  }
});

// Update district data by ID API
app.put('/districts/:districtId', async (req, res) => {
  const { districtId } = req.params;
  const districtDetails = req.body;
  const { districtName, stateId, cases, cured, active, deaths } = districtDetails;
  try {
    const updateDistrictQuery = `
      UPDATE district
      SET district_name = ?, state_id = ?, cases = ?, cured = ?, active = ?, deaths = ?
      WHERE district_id = ?;
    `;
    await db.run(updateDistrictQuery, [districtName, stateId, cases, cured, active, deaths, districtId]);
    res.send('District Details Updated');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Internal Server Error');
  }
});

// Get Stats of a state by state id API
app.get('/states/:stateId/stats/', async (req, res) => {
  const { stateId } = req.params;
  try {
    const getStatsQuery = `
      SELECT SUM(cases) AS totalCases, SUM(cured) AS totalCured, SUM(active) AS totalActive, SUM(deaths) AS totalDeaths
      FROM district
      WHERE state_id = ?;
    `;
    const dbResponse = await db.get(getStatsQuery, [stateId]);
    res.json(dbResponse);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Internal Server Error');
  }
});

// Get State Name by DistrictId API
app.get('/districts/:districtId/details/', async (req, res) => {
  const { districtId } = req.params;
  try {
    const getStateNameQuery = `
      SELECT state.state_name AS stateName
      FROM district
      INNER JOIN state ON district.state_id = state.state_id
      WHERE district.district_id = ?;
    `;
    const dbResponse = await db.get(getStateNameQuery, [districtId]);
    res.json(dbResponse);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = app;
