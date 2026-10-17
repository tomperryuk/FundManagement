import { Fragment } from 'react'
import { jsx as baseJsx, jsxs as baseJsxs } from 'react/jsx-runtime'
import { transform } from './transform.js'

export { Fragment }
export const jsx = (type, props, key) => baseJsx(type, transform(type, props), key)
export const jsxs = (type, props, key) => baseJsxs(type, transform(type, props), key)
