'use strict';

const app = require('./server');

app.listen(process.env.PORT || 5000, () => console.log(`Local app listening on port ${process.env.PORT || 5000}!`));
