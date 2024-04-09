import { Connection, ConnectionConfiguration, Request } from "tedious";

async function getDatabaseVersionInternal(): Promise<string> {
	return new Promise((resolve, reject) => {
		if (
			!process.env.DB_HOST ||
			!process.env.DB_USER ||
			!process.env.DB_PASSWORD ||
			!process.env.DB_NAME
		) {
			console.error("Database connection information missing");
			resolve("N/A");
			return;
		}

		const config: ConnectionConfiguration = {
			server: process.env.DB_HOST,
			authentication: {
				type: "azure-active-directory-msi-app-service",
				// type: "default", // azure-active-directory-msi-app-service
				// options: {
				// 	userName: process.env.DB_USER,
				// 	password: process.env.DB_PASSWORD,
				// },
			},
			options: {
				database: process.env.DB_NAME,
				encrypt: true, // Azure SQL always requires encryption
				trustServerCertificate: true, // Trust the server certificate (change if you have a specific cert)
			},
		};

		const connection = new Connection(config);

		connection.on("connect", (err) => {
			if (err) {
				console.error("Connection Failed", err);
				reject(err);
			} else {
				console.log("Connected successfully to Azure SQL");
				executeStatement();
			}
		});

		function executeStatement() {
			const request = new Request(
				"SELECT * FROM BlikkTest.test",
				(err, rowCount, rows) => {
					if (err) {
						console.error("Error executing query:", err);
						reject("Error executing query");
					} else {
						resolve(`Database Rows: ${rowCount}`);
					}

					connection.close();
				}
			);

			connection.execSql(request);
		}

		connection.connect();
	});
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
