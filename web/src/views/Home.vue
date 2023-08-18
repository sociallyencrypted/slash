<template>
	<main v-if="currentUser" class="vh">
		<h5 class="zero">
			Hello, <span class="blue">{{ currentUser.username }}</span>
		</h5>
		<h1 class="zero">You're registered for Slash.</h1>
		<h4>coming soon.</h4>

		<section id="info">
			<div class="row">
				<div class="twelve columns">
					<div class="row">
						<div class="six columns">
							<p class="zero bold">Username</p>
							<p class="zero bold">Email</p>
						</div>
						<div class="six columns">
							<p class="zero">{{ currentUser.username }}</p>
							<p class="zero">{{ currentUser.email }}</p>
						</div>
					</div>
				</div>
			</div>

			<br />

			<p>Share your username as a referral code to win exclusive prizes.</p>

			<button @click="logOut" class="cool">Logout</button>
		</section>
	</main>
</template>

<script>
import UserService from '../services/user.service'

export default {
	name: 'Home',
	methods: {
		logOut() {
			this.$store.dispatch('auth/logout')
			this.$router.push('/login')
		}
	},
	computed: {
		currentUser() {
			return this.$store.state.auth.user
		}
	},
	mounted() {
		if (!this.currentUser) {
			this.$router.push('/register')
		}
	}
}
</script>

<style scoped lang="scss">
img {
	width: 100%;
}
.blue {
	color: rgb(34, 187, 252);
}
.bold {
	font-weight: 800;
}
.vh {
	height: 70vh;
	display: flex;
	justify-content: flex-start;
	align-items: flex-start;
	flex-direction: column;
}

.brand {
	width: 75%;
}

.vidpen {
	position: relative;
	width: 100%;
	height: 0;
	padding-bottom: 56.25%;
}
.video {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	border-radius: 0.5em;
}

.raisebtn {
	border-color: var(--green);
	border-radius: 0;
	border-width: 0.15em;
	height: 50px;
	padding: 0 inherit;
	margin: 0;
	background-color: var(--green);
	color: #fff;
	text-transform: none;
	font-size: 1em;
	transition: 0.3s;
	&:hover {
		background-color: var(--green-dark);
		border-color: var(--green-dark);
	}
}

.raiseinput {
	border-right: none;
	// padding: 0 !important;
	width: 25em;
	border-color: var(--green);
	border-radius: 0;
	border-width: 0.15em;
	height: 50px;
	margin: 0;
	&:active {
		outline: none;
		border-color: var(--green);
		border-radius: 0;
		border-width: 0.15em;
		border-right: none;
	}
	&:focus {
		outline: none;
		border-color: var(--green);
		border-radius: 0;
		border-width: 0.15em;
		border-right: none;
	}
}

.flexer {
	display: flex;
	justify-content: flex-start;
	align-items: center;
}
</style>
