# Rating\_management



Step 1:-

please update the config/db.js file like Password 

Strat Backend with by entering in folder And send command on terminal    "node server.js" 

&#x20;





Step 2 :- 



Start Frontend with by entering in folder Rating\_Management and send command on terminal "npm run dev "









Step 3: Database

create database in MySQL and table 



CREATE DATABASE IF NOT EXISTS rating\_management;

USE rating\_management;



CREATE TABLE IF NOT EXISTS users (

&#x20; id          INT AUTO\_INCREMENT PRIMARY KEY,

&#x20; name        VARCHAR(60)  NOT NULL,

&#x20; email       VARCHAR(255) NOT NULL UNIQUE,

&#x20; password    VARCHAR(255) NOT NULL,

&#x20; address     VARCHAR(400) NOT NULL,

&#x20; role        ENUM('admin', 'user', 'store\_owner') NOT NULL DEFAULT 'user',

&#x20; created\_at  TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,

&#x20; updated\_at  TIMESTAMP DEFAULT CURRENT\_TIMESTAMP ON UPDATE CURRENT\_TIMESTAMP,



&#x20; INDEX idx\_users\_email  (email),

&#x20; INDEX idx\_users\_role   (role),

&#x20; INDEX idx\_users\_name   (name)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4\_unicode\_ci;







CREATE TABLE IF NOT EXISTS stores (

&#x20; id          INT AUTO\_INCREMENT PRIMARY KEY,

&#x20; name        VARCHAR(60)  NOT NULL,

&#x20; email       VARCHAR(255) NOT NULL UNIQUE,

&#x20; address     VARCHAR(400) NOT NULL,

&#x20; owner\_id    INT,

&#x20; created\_at  TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,

&#x20; updated\_at  TIMESTAMP DEFAULT CURRENT\_TIMESTAMP ON UPDATE CURRENT\_TIMESTAMP,



&#x20; CONSTRAINT fk\_stores\_owner

&#x20;   FOREIGN KEY (owner\_id) REFERENCES users (id)

&#x20;   ON DELETE SET NULL ON UPDATE CASCADE,



&#x20; INDEX idx\_stores\_name     (name),

&#x20; INDEX idx\_stores\_email    (email),

&#x20; INDEX idx\_stores\_owner\_id (owner\_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4\_unicode\_ci;







CREATE TABLE IF NOT EXISTS ratings (

&#x20; id          INT AUTO\_INCREMENT PRIMARY KEY,

&#x20; store\_id    INT        NOT NULL,

&#x20; user\_id     INT        NOT NULL,

&#x20; rating      TINYINT    NOT NULL,

&#x20; created\_at  TIMESTAMP  DEFAULT CURRENT\_TIMESTAMP,

&#x20; updated\_at  TIMESTAMP  DEFAULT CURRENT\_TIMESTAMP ON UPDATE CURRENT\_TIMESTAMP,



&#x20; CONSTRAINT chk\_rating\_range CHECK (rating >= 1 AND rating <= 5),



&#x20; CONSTRAINT uq\_user\_store UNIQUE (user\_id, store\_id),



&#x20; CONSTRAINT fk\_ratings\_store

&#x20;   FOREIGN KEY (store\_id) REFERENCES stores (id)

&#x20;   ON DELETE CASCADE ON UPDATE CASCADE,



&#x20; CONSTRAINT fk\_ratings\_user

&#x20;   FOREIGN KEY (user\_id) REFERENCES users (id)

&#x20;   ON DELETE CASCADE ON UPDATE CASCADE,



&#x20; INDEX idx\_ratings\_store\_id (store\_id),

&#x20; INDEX idx\_ratings\_user\_id  (user\_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4\_unicode\_ci;







INSERT IGNORE INTO users (name, email, password, address, role)

VALUES (

&#x20; 'System Administrator',

&#x20; 'admin@ratingmanagement.com',

&#x20; '$2a$12$QNmCk5Z/LnSviHTqIOpMXuis9WFtED70G0frzS4K3D4jLknrJyj2G', -- Admin@1234

&#x20; 'System Administration Office, HQ',

&#x20; 'admin'

);



&#x20;

step 4 :- 



you will see in terminal this line " http://localhost:5173/"





step 5 :



copy that link and pest the link in browser 

