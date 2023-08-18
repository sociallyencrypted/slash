<template>
	<div id="app">
		<div class="navcont">
			<nav :class="`nav nav-${$route.meta.title}`">
				<h4>
					<router-link to="/">
						<img src="/slash.svg" class="logoimg" alt="" />
					</router-link>
				</h4>
			</nav>
		</div>

		<div class="navcont">
			<router-view />
		</div>

		<footer class="footer">
			<div class="navcont">
				<div class="row">
					<div class="six columns">
						<a href @click.prevent target="_blank">Slash</a>
					</div>
					<div class="six columns">
						<p class="right zero">
							<a href="//arhaanb.com" target="_blank">
								Made with <span style="color: #69e">&#10084;</span> by Arhaan</a
							>
						</p>
					</div>
				</div>
			</div>
		</footer>
	</div>
</template>

<script>
export default {
	computed: {
		currentUser() {
			return this.$store.state.auth.user
		},
		showAdminBoard() {
			if (this.currentUser && this.currentUser['roles']) {
				return this.currentUser['roles'].includes('ROLE_ADMIN')
			}

			return false
		},
		showModeratorBoard() {
			if (this.currentUser && this.currentUser['roles']) {
				return this.currentUser['roles'].includes('ROLE_MODERATOR')
			}

			return false
		}
	},
	methods: {
		logOut() {
			this.$store.dispatch('auth/logout')
			this.$router.push('/login')
		}
	}
}
</script>

<style lang="scss">
.nav-Home {
	display: none;
}

.logoimg {
	width: 3em;
}

nav.nav {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 2em 0;
	margin-bottom: 2em;
	.mid {
		margin-left: 7em;
		a {
			margin-right: 3em;
		}
	}
}

nav a {
	margin-right: 1em;
	font-size: 1.2em;
	&:hover {
		color: var(--green);
	}
}
.nav .router-link-exact-active {
	color: #69e !important;
}

footer.footer {
	padding: 2em 0;
	opacity: 0.7;
}

.right {
	text-align: right;
}

@media (max-width: 750px) {
	footer.footer {
		text-align: center !important;
	}
	.right {
		text-align: center !important;
	}
}
</style>
