import type { LinkProps as ChakraLinkProps } from "@chakra-ui/react";
import { Button as ChakraButton, Link as ChakraLink } from "@chakra-ui/react";
import React, { useId, useState } from "react";

const { version: reactVersion } = React;

console.log("React version:", reactVersion);

export type ButtonProps = {
	readonly children: string;
	readonly test: ChakraLinkProps["hrefLang"];
};

const MY_VARIABLE = "test";

export const Button = ({ children, test }: ButtonProps) => {
	const linkId = useId();
	const [count, setCount] = useState(0);

	return (
		<ChakraLink
			id={linkId}
			data-version={React.version}
			flexGrow={3}
			href="https://github.com/vercel/next.js/blob/canary/examples/with-chakra-ui"
			hrefLang={test}
			mx={2}
		>
			<ChakraButton
				bgGradient="linear(to-tr, teal.300,yellow.400)"
				data-count={count}
				data-test={MY_VARIABLE}
				onClick={() => {
					setCount(count + 1);
				}}
				width="100%"
			>
				{children}
			</ChakraButton>
		</ChakraLink>
	);
};
