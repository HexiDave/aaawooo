import React, { PropsWithChildren, useEffect, useRef, useState } from 'react'
import classes from './Dialog.module.scss'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

const DIALOG_TIMEOUT = 250

interface DialogProps extends PropsWithChildren<{}> {
	isOpen: boolean
}

export default function Dialog({children, isOpen}: DialogProps) {
	const timerRef = useRef<NodeJS.Timer | null>(null)
	const modalRootRef = useRef(document.getElementById('root-modal'))
	const dialogContainerRef = useRef(document.createElement('div'))
	const [isMounted, setIsMounted] = useState(false)

	useEffect(() => {
		const modalRoot = modalRootRef.current
		const dialogContainer = dialogContainerRef.current

		modalRoot?.appendChild(dialogContainer)

		return () => {
			modalRoot?.removeChild(dialogContainer)
		}
	}, [])

	useEffect(() => {
		if (isOpen) {
			setIsMounted(true)
			if (timerRef.current) {
				clearTimeout(timerRef.current)
				timerRef.current = null
			}

			document.body.style.overflow = 'hidden'

			return () => {
				timerRef.current = setTimeout(() => {
					document.body.style.overflow = 'unset'
					timerRef.current = null
					setIsMounted(false)
				}, DIALOG_TIMEOUT)
			}
		}
	}, [isOpen])

	const dialog = (isMounted || isOpen) ? (
		<div className={clsx(classes.DialogBackdrop, {[classes.DialogBackdropOpen]: isOpen && isMounted})}>
			<div className={classes.DialogContainer}>
				<div className={classes.Dialog}>
					{children}
				</div>
			</div>
		</div>
	) : null

	return createPortal(dialog, dialogContainerRef.current)
}
