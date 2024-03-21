import mysql, { RowDataPacket } from "mysql2/promise";
import fs from "fs";
import path from "path";

async function getDatabaseVersionInternal(): Promise<string> {
	const connection = await mysql.createConnection({
		host: process.env.DB_HOST,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
		ssl: {
			ca: fs.readFileSync(
				path.join(process.cwd(), "DigiCertGlobalRootCA.crt.pem"),
				"binary"
			),
		},
	});

	const [rows] = await connection.execute("SELECT VERSION()");
	console.log(rows);
	await connection.end();
	const result = rows as RowDataPacket[];
	console.log("Result: ", result);

	return result[0]["VERSION()"] ?? "N/A";
}

async function getDatabaseVersion(): Promise<string> {
	try {
		const version = await getDatabaseVersionInternal();
		return version;
	} catch (err) {
		console.error("Error: ", err);
		return "N/A";
	}
}

export const dynamic = "force-dynamic";

export default function Home() {
	const dbVersion = getDatabaseVersion();
	const dbHost = process.env.DB_HOST;
	const dbUser = process.env.DB_USER;
	const dbPassword = process.env.DB_PASSWORD;
	const dbName = process.env.DB_NAME;

	return (
		<main className="container mx-auto">
			<h1 className="text-4xl font-bold text-center">Hello, World!</h1>
			<p className="text-center">
				This is a mock application for testing the web app deployment
				for a containerized application.
			</p>
			<h2 className="text-2xl font-bold text-center my-4">
				Current image tag: {process.env.NEXT_PUBLIC_IMAGE_TAG}
			</h2>
			<img
				src="https://blikk.se/wp-content/uploads/2016/10/logo_preview_white_no_tag.png"
				alt="Placeholder Image"
				width="800"
				height="800"
				className="mx-auto my-4"
			/>
			<p className="text-center">
				Database connection information:
				<ul>
					<li>Host: {dbHost}</li>
					<li>User: {dbUser}</li>
					<li>Password: {dbPassword}</li>
					<li>Name: {dbName}</li>
					<li>Database version: {dbVersion}</li>
				</ul>
			</p>
		</main>
	);
}
