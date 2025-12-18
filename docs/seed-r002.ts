import "dotenv/config";
import pg from "pg";
import * as bcrypt from "bcryptjs";

const { Client } = pg;

async function seedR002() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to database");

    // Check if user already exists
    const checkResult = await client.query(
      "SELECT * FROM users WHERE user_id = $1",
      ["R002"]
    );

    const passwordHash = await bcrypt.hash("admin@2025", 10);

    if (checkResult.rows.length > 0) {
      console.log("User R002 already exists. Updating password...");
      await client.query(
        "UPDATE users SET password_hash = $1 WHERE user_id = $2",
        [passwordHash, "R002"]
      );
      console.log("Password updated successfully!");
    } else {
      console.log("Creating new user R002...");
      await client.query(
        `INSERT INTO users (user_id, role, full_name, password_hash, is_active)
         VALUES ($1, $2, $3, $4, $5)`,
        ["R002", "registrator", "Admin User", passwordHash, true]
      );
      console.log("User R002 created successfully!");
    }

    console.log("\n=== Login Credentials ===");
    console.log("Login ID: R002");
    console.log("Password: admin@2025");
    console.log("Role: registrator");
    console.log("Full Name: Admin User");
    console.log("========================\n");

  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
}

seedR002();
