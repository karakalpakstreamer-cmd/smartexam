import "dotenv/config";
import pg from "pg";
import * as bcrypt from "bcryptjs";

const { Client } = pg;

async function seedRegistrator() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to database");

    // Check if registrator already exists
    const checkResult = await client.query(
      "SELECT * FROM users WHERE user_id = $1",
      ["R001"]
    );

    const passwordHash = await bcrypt.hash("admin@2025", 10);

    if (checkResult.rows.length > 0) {
      console.log("Registrator R001 already exists. Updating password...");
      await client.query(
        "UPDATE users SET password_hash = $1 WHERE user_id = $2",
        [passwordHash, "R001"]
      );
      console.log("Password updated successfully!");
    } else {
      console.log("Creating new registrator user...");
      await client.query(
        `INSERT INTO users (user_id, role, full_name, password_hash, is_active)
         VALUES ($1, $2, $3, $4, $5)`,
        ["R001", "registrator", "Administrator", passwordHash, true]
      );
      console.log("Registrator user created successfully!");
    }

    console.log("\n=== Login Credentials ===");
    console.log("Login ID: R001");
    console.log("Password: admin@2025");
    console.log("Role: registrator");
    console.log("========================\n");

  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
}

seedRegistrator();
