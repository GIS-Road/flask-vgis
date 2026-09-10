import router from './router/router'

router.beforeEach(async (to) => {
  if (to.path === '/login') {
    return true
  } else {
    return '/login'
  }
})
