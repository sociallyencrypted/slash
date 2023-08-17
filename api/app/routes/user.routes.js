const { authJwt } = require('../middlewares')
const controller = require('../controllers/user.controller')

const express = require('express')
const app = express.Router()

const User = require('../models/user.model')
const Company = require('../models/company.model')
const Thread = require('../models/threads.model')
const Investment = require('../models/investment.model')
const stripe = require('stripe')(process.env.STRIPE_KEY_2)

const Property = require('../models/property.model')
const PropertyInvestments = require('../models/property_investments.model')

app.get('/all', controller.allAccess)

app.get('/checkout-session', async (req, res) => {
	var domain
	if (process.env.NODE_ENV == 'production') {
		domain = 'https://getpayout.co'
	} else {
		domain = 'http://localhost:3000'
	}

	// console.log(req.query)

	const session = await stripe.checkout.sessions.create({
		line_items: [
			{
				price_data: {
					currency: 'usd',
					product_data: {
						name: `Investment to ${
							req?.query?.company ? req?.query?.company : 'Company Name'
						}`
					},
					unit_amount: parseInt(req?.query?.amt) * 100
				},

				quantity: 1
			}
		],
		billing_address_collection: 'auto',
		shipping_address_collection: {
			allowed_countries: ['US', 'CA']
		},
		mode: 'payment',
		success_url: `${
			process.env.NODE_ENV == 'production'
				? 'https://untitledarhnhack.herokuapp.com'
				: 'http://localhost:8080'
		}/api/success/pay?company=${req?.query?.company}&amt=${
			req?.query?.amt
		}&percent=${req?.query?.percent}&compuser=${req?.query?.username}&userid=${
			req?.query?.userid
		}`,
		cancel_url: `${domain}/discover`
	})

	res.redirect(303, session.url)
})

app.get('/success/pay', (req, res) => {
	var domain
	if (process.env.NODE_ENV == 'production') {
		domain = 'https://getpayout.co'
	} else {
		domain = 'http://localhost:3000'
	}

	var investData = {
		compusername: req?.query?.compuser,
		userid: req?.query?.userid,
		amount: req?.query?.amt,
		percentage: req?.query?.percent,
		companyname: req?.query?.company
	}

	Investment.create(investData, (error, log) => {
		if (error) {
			return res.status(400).send('error')
		}
	})

	Company.findOne({
		username: req?.query?.compuser
	}).exec((err, comp) => {
		if (err) {
			console.log(err)
			return res.status(500).send({ message: 'ERROR' })
		}

		console.log(comp)

		if (comp) {
			comp.investment.current = `${
				parseFloat(comp.investment.current || 0) + parseFloat(req?.query?.amt)
			}`

			comp.save()
			console.log('set current comp value')
		}

		return res.redirect(
			`${domain}/success?company=${req?.query?.company}&amt=${req?.query?.amt}&percent=${req?.query?.percent}&compuser=${req?.query?.compuser}`
		)
	})
})

app.get('/discover', [authJwt.verifyToken], (req, res) => {
	Company.find({
		firstEditComplete: true
	}).exec((err, companies) => {
		if (err) {
			console.log(err)
			return res.status(500).send({ message: 'ERROR' })
		}
		return res.send(companies)
	})
})

app.get('/user', [authJwt.verifyToken], (req, res) => {
	User.findById(req.userId, { password: 0 }).exec((err, user) => {
		if (err) {
			console.log(err)
			return res.status(500).send({ message: 'ERROR' })
		}

		Company.find({ creatorID: req.userId }).exec((err, companies) => {
			if (err) {
				console.log(err)
				return res.status(500).send({ message: 'ERROR' })
			}

			Investment.find({ userid: req.userId }).exec((err, investments) => {
				if (err) {
					console.log(err)
					return res.status(500).send({ message: 'ERROR' })
				}

				var compids = []
				var totalsum = 0

				investments.forEach((i) => {
					totalsum = totalsum + parseFloat(i.amount)
					compids.push(i.compusername)
				})

				Company.find({ username: { $in: compids } }, { password: 0 }).exec(
					(err, compdata) => {
						if (err) {
							console.log(err)
							return res.status(500).send({ message: 'ERROR' })
						}

						return res.send({
							user,
							companies,
							investments,
							compids: compdata,
							totalinv: totalsum
						})
					}
				)
			})
		})
	})
})

// create company
app.post('/createcomp', [authJwt.verifyToken], (req, res) => {
	var compData = {
		name: req.body.name,
		username: req.body.name.split(' ').join('').toLowerCase(),
		tagline: req.body.tagline,
		icon: req.body.icon,
		creatorID: req.userId
	}

	Company.create(compData, (error, log) => {
		if (error) {
			return next(error)
		}
		console.log('company created')
		return res.send({ compData })
	})
})

// edit company
app.post('/editcomp', [authJwt.verifyToken], (req, res) => {
	Company.findOne({ username: req.body.username }).exec((err, company) => {
		if (err) {
			return res.status(400).send('ERROR')
		}

		company.name = req.body.name
		company.tagline = req.body.tagline
		company.icon = req.body.icon
		company.website = req.body.website
		company.location = req.body.location
		company.employees = req.body.employees
		company.compcreated = req.body.compcreated
		company.jobopening = req.body.jobopening
		company.joblink = req.body.joblink
		company.investment.goal = req.body.investment.goal
		company.investment.percentage = req.body.investment.percentage
		company.pitchdeck = req.body.deck
		company.video = req.body.video
		company.images = req.body.images
		company.description = req.body.description

		company.firstEditComplete = true
		company.save()

		return res.send('done')
	})
})

app.post('/editcompname', [authJwt.verifyToken], (req, res) => {
	Company.findOne({ username: req.body.username }).exec((err, company) => {
		if (err) {
			return res.status(400).send('ERROR')
		}

		company.name = req.body.name
		company.tagline = req.body.tagline
		company.save()

		return res.send('done')
	})
})

//add name and img to user

app.post('/addnameimg', [authJwt.verifyToken], (req, res) => {
	User.findOne({ _id: req.userId }).exec((err, user) => {
		if (err) {
			return res.status(400).send('ERROR')
		}

		user.fullname = req.body.name
		user.image = req.body.image
		user.save()

		return res.send({ name: req.body.name, image: req.body.image })
	})
})

//get company information
app.get('/comp/:compname', [authJwt.verifyToken], (req, res) => {
	const companyname = req.params.compname
	Company.findOne({ username: companyname }).exec((err, company) => {
		if (err) {
			console.log(err)
			return res.status(500).send({ message: 'ERROR' })
		}
		var isOwned = false
		if (company?.creatorID == req.userId) {
			isOwned = true
		}

		Thread.findOne({
			$and: [
				{ $or: [{ p1: req.userId }, { p2: req.userId }] },
				{ $or: [{ p1: company.creatorID }, { p2: company.creatorID }] }
			]
		}).exec((err, thread) => {
			if (err) {
				console.log(err)
				return res.status(500).send({ message: 'ERROR' })
			}

			User.findOne({ _id: company.creatorID }, { password: 0, roles: 0 }).exec(
				(err, userdata) => {
					if (err) {
						console.log(err)
						return res.status(500).send({ message: 'ERROR' })
					}

					Investment.findOne(
						{ compusername: companyname, userid: req.userId },
						{ password: 0, roles: 0 }
					).exec((err, investdata) => {
						if (err) {
							console.log(err)
							return res.status(500).send({ message: 'ERROR' })
						}

						var invested
						if (investdata) {
							invested = investdata
						} else {
							invested = false
						}

						if (thread) {
							return res.send({
								company,
								isOwned,
								owner: userdata,
								threadStarted: true,
								threadID: thread._id,
								invested
							})
						} else {
							return res.send({
								company,
								isOwned,
								owner: userdata,
								threadStarted: false,
								invested
							})
						}
					})
				}
			)
		})
	})
})

//get user information
app.get('/user/:userid', [authJwt.verifyToken], (req, res) => {
	const userid = req.params.userid
	User.findOne({ _id: userid }, { password: 0 }).exec((err, userdata) => {
		if (err) {
			console.log(err)
			return res.status(500).send({ message: 'ERROR' })
		}

		return res.send({ userdata })
	})
})

//get all users
app.get('/users', [authJwt.verifyToken], (req, res) => {
	User.find(
		{},
		{ password: 0, roles: 0, salt: 0, hash: 0, createdAt: 0, updatedAt: 0 }
	).exec((err, userdata) => {
		if (err) {
			console.log(err)
			return res.status(500).send({ message: 'ERROR' })
		}

		return res.send({ users: userdata })
	})
})

//start a texting thread
app.post('/create/thread', [authJwt.verifyToken], (req, res) => {
	var threadData = {
		p1: req.userId,
		p2: req.body.p2,
		p1seen: true,
		p2seen: false,
		messages: [
			{
				content: req.body.content,
				from: req.userId,
				date: req.body.date
			}
		],
		lastMessage: req.body.date
	}

	Thread.create(threadData, (error, log) => {
		if (error) {
			console.log(error)
			return res.status(400).send({ error })
		}
		console.log('company created')
		return res.send('text thread created')
	})
})

//send a message (in existing thread)
app.post('/sendmsg', [authJwt.verifyToken], (req, res) => {
	msgdata = {
		content: req.body.content,
		from: req.userId,
		date: req.body.date
	}

	Thread.findOne({ _id: req.body.threadid }).exec((err, threaddata) => {
		if (err) {
			console.log(err)
			return res.status(500).send({ message: 'ERROR' })
		}

		if (threaddata) {
			threaddata.messages.push(msgdata)
			threaddata.lastMessage = req.body.date
			if (req.userId == threaddata.p1) {
				threaddata.p1seen = true
				threaddata.p2seen = false
			} else {
				threaddata.p2seen = true
				threaddata.p1seen = false
			}
			threaddata.save()

			var newthread = JSON.parse(JSON.stringify(threaddata))
			newthread.p1 = undefined
			newthread.p2 = undefined
			newthread.p1seen = undefined
			newthread.p2seen = undefined

			var otherid
			if (req.userId == threaddata.p1) {
				otherid = threaddata.p2
			} else {
				otherid = threaddata.p1
			}

			User.findById(otherid, { password: 0, roles: 0 }).exec((err, user) => {
				if (err) {
					console.log(err)
					return res.status(500).send({ message: 'ERROR' })
				}

				newthread.otheruser = user

				if (user) {
					return res.send({
						msg: 'set seen indication',
						thread: newthread
					})
				} else {
					return res.status(403).send({ error: true, msg: 'nahi h thread' })
				}
			})

			// return res.send({ thread: threaddata })
		} else {
			return res.status(403).send('error')
		}
	})
})

//set seen indication
app.post('/set/seen', [authJwt.verifyToken], (req, res) => {
	Thread.findOne({ _id: req.body.threadid }).exec((err, threaddata) => {
		if (err) {
			console.log(err)
			return res.status(500).send({ message: 'ERROR' })
		}

		if (threaddata) {
			var prsn
			if (req.userId == threaddata.p1) {
				threaddata.p1seen = true
				prsn = 'p1'
			} else {
				threaddata.p2seen = true
				prsn = 'p2'
			}
			threaddata.save()

			var newthread = JSON.parse(JSON.stringify(threaddata))
			newthread.p1 = undefined
			newthread.p2 = undefined
			newthread.p1seen = undefined
			newthread.p2seen = undefined

			var otherid
			if (prsn == 'p1') {
				otherid = threaddata.p2
			} else {
				otherid = threaddata.p1
			}

			User.findById(otherid, { password: 0, roles: 0 }).exec((err, user) => {
				if (err) {
					console.log(err)
					return res.status(500).send({ message: 'ERROR' })
				}

				newthread.otheruser = user

				if (user) {
					return res.send({
						msg: 'set seen indication',
						thread: newthread,
						prsn
					})
				} else {
					return res.status(403).send({ error: true, msg: 'nahi h thread' })
				}
			})
		} else {
			return res.status(403).send({ error: true, msg: 'nahi h thread' })
		}
	})
})

//get all threads
app.get('/threads', [authJwt.verifyToken], (req, res) => {
	Thread.find({ $or: [{ p1: req.userId }, { p2: req.userId }] }).exec(
		(err, threads) => {
			if (err) {
				console.log(err)
				return res.status(500).send({ message: 'ERROR' })
			}

			var users = []
			var newthreads = JSON.parse(JSON.stringify(threads))

			newthreads.forEach((t, index) => {
				if (t.p1 == req.userId) {
					users.push(t.p2)
				} else {
					users.push(t.p1)
				}
			})
			// newthreads[0].hello = 'yo'
			// console.log(newthreads[0])

			var userarray = []

			// users.forEach((u, index) => {
			User.find({ _id: { $in: users } }, { password: 0 }).exec(
				(err, userbro) => {
					if (err) {
						console.log(err)
						return res.status(500).send({ message: 'ERROR' })
					}

					// var revthread =
					return res.send({
						threads: newthreads.reverse(),
						users: userbro.reverse()
					})
				}
			)
			// })
		}
	)
})

//get specific thread
app.get('/threads/:threadid', [authJwt.verifyToken], (req, res) => {
	Thread.findOne({ _id: req.params.threadid }).exec((err, threads) => {
		if (err) {
			console.log(err)
			return res.status(500).send({ message: 'ERROR' })
		}

		return res.send({ threads })
	})
})

app.get('/properties', (req, res) => {
	// const new_props = new Property({
	// 	image: "test",
	// 	description: "String",
	// 	share_price: "String",
	// 	avg_rent: "String",
	// 	commission: "String",
	// 	total_price: "String",
	// 	total_shares: "String",
	// 	address: "String",
	// 	locality: "String"
	// })

	// new_props.save( (err,user) => {
	// 	if (err) {
	// 		res.status(500).send("Error")
	// 	}

	// 	console.log(user)
	// } )

	Property.find().exec((err, properties) => {
		if (err) {
			console.log(err)
			return res.send(500).send({ message: 'ERROR' })
		}

		return res.send({ properties })
	})
})

// Retrieve property by id
app.get('/property/:id', (req, res) => {
	const _id = req.params.id
	Property.findOne({ _id: _id }).exec((err, property) => {
		if (err) {
			res.status(500).send({ message: 'ERROR' })
			return
		}

		res.status(200).send({ property: property })
	})
})

app.post('/property/upload', (req, res) => {
	const property = new Property({
		image: req?.body?.image,
		description: req?.body?.description,
		share_price: req?.body?.share_price,
		avg_rent: req?.body?.avg_rent,
		commission: req?.body?.commossion,
		total_price: req?.body?.total_price,
		total_shares: req?.body?.total_shares,
		address: req?.body?.address,
		locality: req?.body?.locality,
		other_images: req?.body?.other_images
	})

	property.save((err, property) => {
		if (err) {
			console.log(err)
			res.status(500).send({ message: err })
		}

		res.status(200).send({ message: 'Property created!' })
	})
})

app.post('/property/edit/:id', (req, res) => {
	// const id = req.params.id;
	// Property.findOne( {"_id": id} ).exec( (err,property) => {
	// 	if( err ) {
	// 		res.status(500).send({message: "ERROR"})
	// 		return
	// 	}

	// 	// Changing values
	// 	// try
	// 	// {
	// 		property.image = req?.body?.image,
	// 		property.desription = req?.body?.description,
	// 		property.share_price = req?.body?.share_price,
	// 		property.avg_rent = req?.body?.avg_rent,
	// 		property.commission = req?.body?.commission,
	// 		property.total_price = req?.body?.total_price,
	// 		property.total_shares = req?.body?.total_shares,
	// 		property.address = req?.body?.address,
	// 		property.locality = req?.body?.locality

	// 		property.save()
	// 	// }
	// // 	catch(err) {
	// // 		res.send(500).send({message: err})
	// // 		return
	// // 	}

	// 	res.send(200).send({message: "Property details updated!"})

	// } )
	Property.findOne({ _id: req.params.id }).exec((err, prop) => {
		if (err) {
			return res.status(400).send('ERROR')
		}

		;(prop.image = req?.body?.image),
			(prop.desription = req?.body?.description),
			(prop.share_price = req?.body?.share_price),
			(prop.avg_rent = req?.body?.avg_rent),
			(prop.commission = req?.body?.commission),
			(prop.total_price = req?.body?.total_price),
			(prop.total_shares = req?.body?.total_shares),
			(prop.address = req?.body?.address),
			(prop.locality = req?.body?.locality)

		prop.save()

		return res.send('done')
	})
})

// Add a new investment
app.post("/investments/add", (req,res) => {
	const property_investment = new PropertyInvestments({
		userid: req.body.userid,
		property_id: req.body.property_id,
		amount: req.body.amount,
		shares: req.body.shares,
		address: req.body.address
	})

	property_investment.save( (err,data) => {
		if(err) {
			console.log(err)
			res.status(500).send({message: err})
			return
		}

		res.status(200).send({message: "Investment created!"})
	} )


} )

app.get("/property/investments/:userid", (req,res) => {
	PropertyInvestments.find({
		userid: req.params.userid
	}).exec( (err,investments) => {
		if(err) {
			console.log(err)
			res.status(500).send({message: err})
			return
		}

		props = []

		investments.map( (c) => {
			props.push(c.property_id)
		} )

		console.log(props)

		Property.find({
			_id: props
		}).exec( (err,property) => {
			if(err) {
				console.log(err)
				res.status(500).send({message: err})
				return
			}

			res.status(200).send({data: property})

		} )

		// res.status(200).send(investments)
	} )
} )

app.get("/user/invested-properties/:userid", (req,res) => {

	var prop_ids = []

	PropertyInvestments.find({
		userid: req.params.userid
	}).exec( (err,investments) => {
		if( err ) {
			res.status(500).send({message: err})
			return
		}

		investments.map( (c) => {
			prop_ids.push(c.property_id)
		} )

		res.status(200).send({property_ids: prop_ids})

	} )
})

app.get("/user/total_capital/:userid", (req,res) => {
	PropertyInvestments.find({
		userid: req.params.userid
	}).exec( (err,investments) => {

		if(err) {
			res.status(500).send({message: err})
			return
		}

		var amount = 0;
		investments.map( (c) => {
			amount = amount + parseInt(c.amount,10)
		} )

		res.status(200).send({total_capital: amount})
	} )
} )

// app.get(
// 	'/test/mod',
// 	[authJwt.verifyToken, authJwt.isModerator],
// 	controller.moderatorBoard
// )

// app.get(
// 	'/test/admin',
// 	[authJwt.verifyToken, authJwt.isAdmin],
// 	controller.adminBoard
// )

module.exports = app
