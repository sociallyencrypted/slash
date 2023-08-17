const mongoose = require('mongoose')

const property = mongoose.model(
	'Property',
	new mongoose.Schema({
		// fullname: String,
		// username: String,
		// email: String,
		// password: String,
		// image: String,

		image: String,
		description: String,
		share_price: String,
		avg_rent: String,
		commission: String,
		total_price: String,
		total_shares: String,
		address: String,
		locality: String,
		other_images: [
			String,
			String,
			String
		]

		// roles: [
		// 	{
		// 		type: mongoose.Schema.Types.ObjectId,
		// 		ref: 'Role'
		// 	}
		// ]
	})
)

module.exports = property
