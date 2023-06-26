import {
	JSXAttrValue,
	JSXOpeningElement,
	Node,
	TsType,
	parse,
} from "@swc/core";
import { Visitor } from "@swc/core/Visitor";

type SonarNode = {
	/* Metadata */
	createdAt: string;
	/* Data */
	name: string;
	module: string;
	version: string;
	type: "component" | "type" | "method" | "variable" | "unknown";
	args?: {
		data: Record<string, unknown>;
		isSpread: boolean;
	};
	location: {
		url: string; // Versioned (GitHub, ...) link if available, otherwise relative path
		line: number;
		column: number;
		module: string; // Consumer package
		repository: string; // Consumer repository
	};
};

const data: Array<SonarNode> = [];

type PrimitiveValue = string | boolean | undefined | null | bigint | number;

const getUnsupportedValue = (node: Node) => `type#${node.type}`;

const getLiteralValue = (node: JSXAttrValue | undefined): PrimitiveValue => {
	if (!node) {
		return true;
	}

	if (node.type === "NullLiteral") {
		return null;
	}

	if (
		node.type === "StringLiteral" ||
		node.type === "NumericLiteral" ||
		node.type === "BigIntLiteral" ||
		node.type === "BooleanLiteral" ||
		node.type === "JSXText"
	) {
		return node.value;
	}

	if (node.type === "JSXExpressionContainer") {
		return getLiteralValue(node.expression as JSXAttrValue);
	}

	return getUnsupportedValue(node);
};

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
		if (n.name.type !== "Identifier") return n;

		data.push({
			createdAt: new Date().toISOString(),
			location: {
				...getLocation(this.source, n.span.start),
				url: "",
				module: "",
				repository: "",
			},
			module: "",
			name: n.name.value,
			type: "component",
			version: "",
			args: {
				isSpread: false,
				data: n.attributes.reduce<Record<string, unknown>>(
					(props, prop) => {
						if (
							prop.type !== "JSXAttribute" ||
							prop.name.type !== "Identifier"
						)
							return props;

						props[prop.name.value] = getLiteralValue(prop.value);

						return props;
					},
					{}
				),
			},
		});

		return n;
	}

	override visitTsType(n: TsType): TsType {
		return n;
	}
}

const scan = async () => {
	const module = await parse(EXAMPLE, {
		syntax: "typescript",
		tsx: true,
	});

	new CustomVisitor(EXAMPLE).visitModule(module);

	console.log(JSON.stringify(data, null, 2));
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
