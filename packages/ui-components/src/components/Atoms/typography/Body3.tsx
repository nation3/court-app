import React, { ReactNode } from "react";

interface Props {
	children: ReactNode;
	className?: string;
	color?: string;
}

export const Body3 = (props: Props) => {
	const { color, children, className } = props;
	return (
		<p
			{...props}
			className={`text-xs md:text-sm leading-5 md:leading-6 tracking-wide text-${
				color ? color : "neutral-c-800"
			} ${className}`}
		>
			{children}
		</p>
	);
};
