import React from "react";
import cx from "classnames";

const GridContainer: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className}) => {
    return (
		<div className={cx(
            "grid",
            "grid-cols-xs gap-xs",
            "md:grid-cols-md md:gap-md",
            "xl:grid-cols-xl xl:gap-xl",
            className
        )}>
        {children}
        </div>
    )
}

export default GridContainer;