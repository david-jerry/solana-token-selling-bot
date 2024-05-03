import 'dotenv/config';
import sqlite3 from "sqlite3";
import { coloredInfo, coloredError, coloredWarn, coloredDebug } from "../../src/utils/logger";
import sleep from '../utils/sleepTimout';

class DatabaseConnector {
    db: sqlite3.Database;

    constructor(dbName: string = 'priceStore.db') {
        this.db = new sqlite3.Database(dbName);
    }

    /**
     * Creates a new table in the database if it does not exist already.
     * @param {string} dbTable - The name of the database table.
     * @example
     * createDb("tableName");
     */
    createDb = async (dbTable: string = "tokens"): Promise<void> => {
        this.db.run(`CREATE TABLE IF NOT EXISTS ${dbTable} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        balance INTEGER,
        purchaseAmount INTEGER,
        sellAmount INTEGER
    )`);
    };

    /**
     * Stores new data into the specified database table.
     * @param {string} dbTable - The name of the database table.
     * @param {string} tokenName - The name of the token.
     * @param {number} tokenBalance - The balance of the token.
     * @param {number} purchasePrice - The purchase price of the token.
     * @param {number} sellingPrice - The selling price of the token.
     * @example
     * storeNewData("tableName", "TokenName", 100, 10, 20);
     */
    storeNewData = async (dbTable: string, tokenName: string, tokenBalance: number, purchasePrice: number, sellingPrice: number): Promise<void> => {
        this.db.run(`INSERT INTO ${dbTable} (name, balance, purchaseAmount, sellAmount) VALUES (?, ?, ?, ?)`, [tokenName, tokenBalance, purchasePrice, sellingPrice], async (err: { message: any; }) => {
            if (err) {
                coloredError(err.message, "DB");
                if (err.message.includes('no such table')) {
                    await this.createDb(dbTable).then(() => {
                        this.db.run(`INSERT INTO ${dbTable} (name, balance, purchaseAmount, sellAmount) VALUES (?, ?, ?, ?)`, [tokenName, tokenBalance, purchasePrice, sellingPrice], async (err: { message: any; }) => {
                            if (err) {
                                coloredError(err.message, "DB");
                                await sleep(7000);
                            } else {
                                coloredInfo(`Inserted data with id`, "DB");
                                await sleep(7000);
                            }
                        });
                    })
                }
            } else {
                coloredInfo(`Inserted data with id`, "DB");
                await sleep(7000);
            }
        });

    };

    /**
     * Updates data in the specified database table.
     * @param {string} dbTable - The name of the database table.
     * @param {string} tokenName - The name of the token.
     * @param {string} key - The column to be updated.
     * @param {any} value - The new value of the column.
     * @example
     * updateData("tableName", "TokenName", "balance", 200);
     */
    updateData = async (dbTable: string, tokenName: string, key: string, value: any): Promise<void> => {
        this.db.run(`UPDATE ${dbTable} SET ${key} = ? WHERE name = ${tokenName}`, [value], (err: { message: any; }) => {
            if (err) {
                coloredError(err.message, "DB");
            } else {
                coloredInfo(`Modified rows(s)`, "DB");
            }
        });
    };

    /**
     * Deletes data from the specified database table.
     * @param {string} dbTable - The name of the database table.
     * @param {string} tokenName - The name of the token.
     * @example
     * deleteData("tableName", "TokenName");
     */
    deleteData = async (dbTable: string, tokenName: string): Promise<void> => {
        this.db.run(`DELETE FROM ${dbTable} WHERE name = ${tokenName}`, [], (err: { message: any; }) => {
            if (err) {
                coloredError(err.message, "DB");
            } else {
                coloredInfo(`Deleted row(s)`, "DB");
            }
        });
    };

    /**
     * Retrieves data from the specified database table.
     * @param {string} dbTable - The name of the database table.
     * @param {Function} callback - The callback function to handle the retrieved data.
     * @example
     * getData("tableName", (data) => {
     *     console.log(data);
     * });
     */
    getData = async (dbTable: string, callback: (data: any[]) => void): Promise<void> => {
        const data: any[] = [];
        this.db.each(`SELECT * FROM ${dbTable}`, (err: { message: any; }, row: any) => {
            if (err) {
                coloredError(err.message, "DB");
            } else {
                data.push(row);
            }
        }, (err: { message: any; }, count: any) => {
            if (err) {
                console.error(err.message);
            } else {
                coloredInfo(`Retrieved ${count} row(s)`);
                callback(data); // Call the callback function with the retrieved data
            }
        });
    };
}

export default DatabaseConnector;
