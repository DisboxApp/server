const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./disbox.db')

db.run(`
CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY,
    user_id TEXT,
    parent_id INTEGER,
    name TEXT,
    type TEXT,
    size INTEGER,
    content TEXT,
    created_at TEXT,
    updated_at TEXT
);
`, (err) => {
    if (err) {
        console.log(err);
        throw err;
    }
})

// TODO: Optimize tree size by removing null fields
function getFileTree(user_id, resolve=() => {}) {
    db.all(`SELECT * FROM files WHERE user_id = ?`, [user_id], (err, rows) => {
        if (err) {
            console.log(err);
            resolveError(err, null);
            return;
        }
        const allDirectories = {};
        const root = {children:{}};
        rows.forEach(row => {
            let entry = row;
            row.user_id = undefined;
            if (row.type === 'directory') {
                if (!(row.id in allDirectories)) {
                    allDirectories[row.id] = { ...row, children: {} };
                } else {
                    allDirectories[row.id] = { ...allDirectories[row.id], ...row };
                }
                entry = allDirectories[row.id];
            }

            if (entry.parent_id === null) {
                root.children[entry.name] = entry;
            } else {
                if (!entry.parent_id in allDirectories) {
                    allDirectories[entry.parent_id] = {
                        children: {}
                    };
                }
                allDirectories[entry.parent_id].children[entry.name] = entry;
            }
        });
        resolve(null, root);
    });
}

function updateFile(user_id, id, file, resolve=() => {}) {
    // Only update present fields in sqlite
    const fields = Object.keys(file);
    const values = fields.map(field => `${field} = $${field}`);
    const fileWithPrefixes = {};
    fields.forEach((field) => {
        fileWithPrefixes[`$${field}`] = file[field];
    });
    const sql = `UPDATE files SET ${values.join(', ')} WHERE user_id = $user_id AND id = $id`;
    db.run(sql, {
        ...fileWithPrefixes,
        $user_id: user_id, // TODO: Test spread operator override rules
        $id: id
    }, (err) => {
        if (err) {
            console.log(err);
            resolve(err);
            return;
        } else {
            resolve(null);
        }
    });
}


function createFile(user_id, file, resolve=() => {}) {
    const fields = Object.keys(file);
    fields.push('user_id');
    const values = fields.map(field => `$${field}`);
    const fileWithPrefixes = {};
    fields.forEach((field) => {
        fileWithPrefixes[`$${field}`] = file[field];
    });
    const sql = `INSERT INTO files (${fields.join(', ')}) VALUES (${values.join(', ')})`;
    db.run(sql, {
        ...fileWithPrefixes,
        $user_id: user_id // TODO: Test spread operator override rules
    }, function(err) {
        if (err) {
            console.log(err);
            resolve(err, null);
            return;
        } else {
            resolve(null, this.lastID);
        }
    });
}

function deleteFile(user_id, id, resolve=() => {}) {
    db.run(`DELETE FROM files WHERE user_id = $user_id AND id = $id`, {
        $user_id: user_id,
        $id: id
    }, (err) => {
        if (err) {
            console.log(err);
            resolveError(err);
            return;
        } else {
            resolve(null);
        }
    });
}

module.exports = {
    getFileTree,
    updateFile,
    createFile,
    deleteFile
}
