import { Fragment } from 'react'
import { jsxDEV as baseJsxDEV } from 'react/jsx-dev-runtime'
import { transform } from './transform.js'

export { Fragment }
export const jsxDEV = (type, props, key, isStatic, source, self) => baseJsxDEV(type, transform(type, props), key, isStatic, source, self)
