import axios from 'axios'
import { baseStuff } from '../plugins/base.js'
console.log(baseStuff?.baseRoute)

const API_URL = `${baseStuff?.baseRoute}api/auth/`

class AuthService {
	login(user) {
		return axios
			.post(API_URL + 'signin', {
				username: user.username,
				password: user.password
			})
			.then((response) => {
				if (response.data.accessToken) {
					localStorage.setItem('user', JSON.stringify(response.data))
				}

				return response.data
			})
	}

	logout() {
		localStorage.removeItem('user')
	}

	register(user) {
		return axios.post(API_URL + 'signup', {
			username: user.username,
			email: user.email,
			password: user.password,
			fullname: user.fullname
		})
	}
}

export default new AuthService()
