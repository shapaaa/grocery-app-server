const { rule, shield } = require('graphql-shield');

const isAuthenticated = rule()(
	//check if user is auth grocer by getting data from database
	(parent, { id }, { user }) => {
		const t = user.id;
		return t == id;
	}
);
const permissions = shield({
	Query: {
		user: isAuthenticated,
	},
});
module.exports = permissions;
