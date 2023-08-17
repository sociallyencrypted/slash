var baseRoute = ''
if (process.env.NODE_ENV == 'production') {
	baseRoute = 'https://untitledarhnhack.herokuapp.com/'
} else {
	baseRoute = 'http://localhost:8080/'
}

export const baseStuff = {
	baseRoute
}
