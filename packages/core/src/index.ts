import {
	JSXOpeningElement,
	TsPropertySignature,
	TsType,
	parse,
} from "@swc/core";
import { Visitor } from "@swc/core/Visitor";

const getLocation = (content: string, offset: number) => {
	const linesTillOffset = content.substring(0, offset).split(/\n/);
	const line = linesTillOffset.length;
	const column = (linesTillOffset[line - 1] as string).length;

	return {
		line,
		column,
	};
};

class CustomVisitor extends Visitor {
	source: string;

	constructor(source: string) {
		super();
		this.source = source;
	}

	override visitJSXOpeningElement(n: JSXOpeningElement): JSXOpeningElement {
		console.log(
			"JSXOpeningElement",
			n.name.type === "Identifier" ? n.name.value : n.name,
			getLocation(this.source, n.span.start)
		);

		return n;
	}

	visitTsType(n: TsType): TsType {
		console.log("TsType", n);

		return n;
	}

	visitTsPropertySignature(n: TsPropertySignature): TsPropertySignature {
		console.log("TsPropertySignature", n);

		return n;
	}
}

const scan = async () => {
	const module = await parse(EXAMPLE, {
		syntax: "typescript",
		tsx: true,
	});

	new CustomVisitor(EXAMPLE).visitModule(module);
};

const EXAMPLE = `import { Link as ChakraLink, Button } from '@chakra-ui/react'
export interface ButtonProps {
  children: string;
}
export const Button = (props: ButtonProps) => (
  <ChakraLink
    isExternal
    href="https://github.com/vercel/next.js/blob/canary/examples/with-chakra-ui"
    flexGrow={3}
    mx={2}
  >
    <Button width="100%" bgGradient="linear(to-tr, teal.300,yellow.400)">
      {props.children}
    </Button>
  </ChakraLink>
)`;

scan();
