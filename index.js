const { ApolloServer, gql, makeExecutableSchema } = require('apollo-server-express');
const express = require('express');
const { users } = require('./src/data');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const permissions = require('./src/permissions');
const { applyMiddleware } = require('graphql-middleware');
require('dotenv').config();

const port = 4000;
const app = express();
app.use(
	expressJwt({ secret: process.env.PRIVATE_KEY, algorithms: ['HS256'], credentialsRequired: false })
);

const validateLogin = (email, password) => {
	const result = users.find((user) => user.email === email && user.password === password);
	if (result) {
		return result;
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
	type Query {
		user(id: ID!): User
	}
	#here we are creating login mutation for email & password based authentication which returns JWT as string
	type Mutation {
		login(email: String!, password: String!): String
		signUp(email: String!, password: String!): User
	}
`;
const resolvers = {
	Query: {
		user(parent, { id }, { user }) {
			return user;
		},
	},
	Mutation: {
		signUp(parent, { email, password }) {
			const newId = users[users.length - 1].id + 1;
			const user = { id: newId, email, password };
			users.push(user);
			return user;
		},
		login(parent, { email, password }) {
			const result = validateLogin(email, password);
			if (result) {
				//sign jwt token & return
				const token = jwt.sign(
					{ id: result.id, email, role: 'authenticated' },
					process.env.PRIVATE_KEY,
					{
						expiresIn: '2h',
					}
				);
				return token;
			} else {
				return {
					status: 401,
					error: 'Invalid Credentials',
				};
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
		};
	},
});
server.applyMiddleware({ app });
// The `listen` method launches a web server.
app.listen({ port }, () =>
	console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
);
