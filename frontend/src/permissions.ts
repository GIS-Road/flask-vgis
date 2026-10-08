import router from './router/router'
import { getToken } from './utils/auth'

router.beforeEach(async (to) => {
  const token = getToken()

  if (token) {
    if (to.path === '/login') {
      return { path: '/' }
    }
    return true
  } else {
    if (to.path !== '/login') {
      return { path: '/login' }
    }
    return true
  }
})
