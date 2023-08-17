var mongoose = require('mongoose')
var Schema = mongoose.Schema

var PropertyInvestmentsSchema = new Schema({
	userid: String,
	property_id: String,
	amount: String,
	shares: String,
	address: String
})

var PropertyInvestments = mongoose.model('PropertyInvestments', PropertyInvestmentsSchema)
module.exports = PropertyInvestments
