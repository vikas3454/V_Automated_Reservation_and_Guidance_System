const mqtt = require('mqtt');
const connection = require('./config/db'); // Import MySQL connection

// MQTT Broker Configuration
const mqttOptions = {
    host: 'c6d0fc04932e40b99b758f8c8c4700f1.s1.eu.hivemq.cloud',
    port: 8883,
    protocol: 'mqtts',
    username: 'hivemq.webclient.1718301875241',
    password: '70,1dLkB8Q%sbD;:HfAi'
};

// Initialize MQTT Client
const mqttClient = mqtt.connect(mqttOptions);

// MQTT Client Event Handlers
mqttClient.on('connect', function () {
    console.log('Connected to MQTT broker');
    mqttClient.subscribe('vikas'); // Subscribe to parking slot updates
});

mqttClient.on('error', function (error) {
    console.error('MQTT Error:', error);
});

mqttClient.on('message', function (topic, message) {
    console.log(`Received message on topic ${topic}:`, message.toString());

    try {
        const data = JSON.parse(message.toString());

        if (topic === 'vikas') {
            updateParkingSlots(data);
        }
    } catch (error) {
        console.error('Error parsing JSON:', error);
    }
});

// Function to update parking slot status in the database
function updateParkingSlots(slotData) {
    if (!Array.isArray(slotData) || slotData.length !== 4) {
        console.error('Invalid slot data format:', slotData);
        return;
    }

    connection.query('START TRANSACTION', (err) => {
        if (err) {
            console.error('Error starting transaction:', err);
            return;
        }

        let queries = [];
        let processedSlots = 0;

        slotData.forEach((status, i) => {
            const slotId = i + 1; // slot_id starts from 1

            // Fetch current status before updating
            connection.query(
                'SELECT status FROM parkingslots WHERE area_id = 1 AND slot_id = ?',
                [slotId],
                (err, results) => {
                    if (err) {
                        console.error('Error fetching current status:', err);
                        connection.query('ROLLBACK');
                        return;
                    }

                    const currentStatus = results[0]?.status;

                    // Condition to check if the current status is 1 and incoming data is 0
                    if (currentStatus === 1 && status === 0) {
                        console.log(`Slot ${slotId} is reserved. Ignoring update from 1 to 0.`);
                    } 
                    // Only update if the new status is different
                    else if (currentStatus !== status) {
                        queries.push({
                            query: 'UPDATE parkingslots SET status = ? WHERE area_id = 1 AND slot_id = ?',
                            values: [status, slotId]
                        });
                    }

                    processedSlots++;

                    // Execute queries only when all slots are processed
                    if (processedSlots === slotData.length) {
                        executeQueries(queries);
                    }
                }
            );
        });
    });
}

// Function to execute update queries sequentially
function executeQueries(queries) {
    if (queries.length === 0) {
        console.log('No updates required.');
        connection.query('COMMIT');
        return;
    }

    function runQuery(index) {
        if (index >= queries.length) {
            connection.query('COMMIT', (err) => {
                if (err) {
                    console.error('Error committing transaction:', err);
                    connection.query('ROLLBACK');
                } else {
                    console.log('Transaction committed successfully.');
                }
            });
            return;
        }

        let currentQuery = queries[index];
        connection.query(currentQuery.query, currentQuery.values, (err) => {
            if (err) {
                console.error('Error executing query:', err);
                connection.query('ROLLBACK');
                return;
            }
            console.log(`Updated slot ${currentQuery.values[1]} to status ${currentQuery.values[0]}`);
            runQuery(index + 1);
        });
    }

    runQuery(0);
}

module.exports = mqttClient;
