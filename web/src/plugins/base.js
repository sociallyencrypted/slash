var baseRoute = ''
if (process.env.NODE_ENV == 'production') {
	baseRoute = 'http://slash.win:8080/'
} else {
	baseRoute = 'http://localhost:8080/'
}

export const baseStuff = {
	baseRoute
}
