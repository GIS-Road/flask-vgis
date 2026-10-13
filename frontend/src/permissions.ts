import router from './router/router'
import { getToken } from './utils/auth'

const whiteList = ['/login', '/register', '/forgetPassword']
router.beforeEach(async (to) => {
  const token = getToken()

  if (token) {
    if (to.path === '/login') {
      return { path: '/' }
    }
    return true
  } else {
    if (to.path !== '/login') {
      if (whiteList.includes(to.path)) {
        return true
      } else {
        return { path: '/login' }
      }
    }
    return true
  }
})
