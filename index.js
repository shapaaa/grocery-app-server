const { ApolloServer, gql, makeExecutableSchema } = require('apollo-server-express');
const { ApolloError } = require('apollo-server-errors');
const express = require('express');
const cors = require('cors');
const { users } = require('./src/data');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const permissions = require('./src/permissions');
const db = require('./src/db');
const { applyMiddleware } = require('graphql-middleware');
require('dotenv').config();

var id = 1;
const port = 4000;
const app = express();
app.use(cors());
app.use(
	expressJwt({ secret: process.env.PRIVATE_KEY, algorithms: ['HS256'], credentialsRequired: false })
);

const validateLogin = async (email, password) => {
	//validate if user is signed up
	try {
		const result = await db.query(
			'SELECT * FROM users WHERE users.email = $1 AND users.password = $2',
			[email, password]
		);
		const user = result.rows[0];
		if (user) {
			return user;
		}
	} catch (error) {
		console.log(error);
	}
	return false;
};
const typeDefs = gql`
	type User {
		id: ID!
		role: String!
		firstName: String
		lastName: String
		name: String
		email: String
		password: String
	}
	type Demo {
		name: String
	}
	type Query {
		user(id: ID!): User
		demo: Demo
	}
	#here we are creating login mutation for email & password based authentication which returns JWT as string
	type Mutation {
		login(email: String!, password: String!): String
		signUp(email: String!, password: String!): User
	}
`;
const resolvers = {
	Query: {
		user: async (parent, { id }, { user }) => {
			try {
				const data = await db.query('SELECT * FROM users WHERE id = user.id');
			} catch (err) {
				console.log(err);
			}
			return user;
		},
		demo() {
			return { name: 'shardul' };
		},
	},
	Mutation: {
		signUp: async (parent, { email, password }, { db }) => {
			try {
				await db.query('INSERT INTO users (id,email,password,name,role) VALUES ($1,$2,$3,$4,$5)', [
					id,
					email,
					password,
					'shapa',
					'authe',
				]);
				id++;
				return { email, password };
			} catch (err) {
				console.log(err);
			}
		},
		login: async (parent, { email, password }) => {
			const result = await validateLogin(email, password);
			if (result) {
				//sign jwt token & return
				const token = jwt.sign(result, process.env.PRIVATE_KEY, {
					expiresIn: '2h',
				});
				return token;
			} else {
				return new ApolloError('Invalid Credentials', '401');
			}
		},
	},
};
const server = new ApolloServer({
	schema: applyMiddleware(makeExecutableSchema({ typeDefs, resolvers }), permissions),
	context: ({ req }) => {
		const user = req.user || null;
		return {
			user,
			db: db,
		};
	},
});
server.applyMiddleware({ app });
// The `listen` method launches a web server.
app.listen({ port }, () =>
	console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
);
