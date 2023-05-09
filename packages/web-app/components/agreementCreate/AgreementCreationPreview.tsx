import { constants } from "ethers";

import { useAgreementCreate } from "../../hooks/useAgreement";

import { preparePutToIPFS } from "../../lib/ipfs";
import { generateAgreementMetadata } from "../../utils";

import { Button, Card, HeadlineBasic, ModalNew } from "@nation3/ui-components";

import {
	AnimationLoader,
	Body3,
	BodyHeadline,
	IllustrationRenderer,
	InfoAlert,
	N3AgreementDone,
	useScreen,
} from "@nation3/ui-components";
import cx from "classnames";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { useState } from "react";
import CompleteAnimation from "../../public/animations/Complete.json";
import EncryptingAnimation from "../../public/animations/Encrypting_file.json";
import AgreementCard from "../agreement/AgreementCard/AgreementCard";
import { useAgreementCreation } from "./context/AgreementCreationContext";

interface AgreemetCreationPreviewProps {
	setActiveStep: (step: number) => void;
}

export const AgreementCreationPreview: React.FC<AgreemetCreationPreviewProps> = ({
	setActiveStep,
}) => {
	const router = useRouter();
	const {
		title,
		terms,
		termsHash,
		token,
		id,
		salt,
		positions,
		filePass,
		fileName,
		fileStatus,
		changeView,
	} = useAgreementCreation();

	const {
		create,
		isLoading: createLoading,
		isTxSuccess: createSuccess,
		isError: createError,
		isProcessing: createProcessing,
	} = useAgreementCreate({});
	const { screen } = useScreen();
	const [isAgreementCreated, setisAgreementCreated] = useState<boolean>(false);

	const submit = async () => {
		setIsOpen(true);
		const metadata = await generateAgreementMetadata({
			title,
			terms,
			positions,
			filePass,
			fileName,
			fileStatus,
		});

		const { put } = await preparePutToIPFS(metadata);
		const cid = await put();
		const metadataURI = `ipfs://${cid}`;
		console.log(`$$$ CID IPFS ${metadataURI}`);

		create({
			termsHash: metadata.termsHash,
			criteria: metadata.criteria,
			metadataURI,
			token: token?.address ?? constants.AddressZero,
			salt,
		});
	};

	// MODAL CONTROLLER
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const handleOpen = () => {
		setIsOpen(true);
	};
	const handleClose = () => {
		setIsOpen(false);
	};

	return (
		<>
			<article className="flex flex-col w-full gap-min3 md:gap-base">
				<HeadlineBasic className="mt-min3 md:mt-base">Review & Submit </HeadlineBasic>
				<section className="w-full md:bg-neutral-c-200 rounded-md md:p-base flex justify-center">
					<div className="flex max-w-sm w-full">
						<AgreementCard
							token={token}
							id={id ?? constants.HashZero}
							title={title}
							status={"Preview"}
							termsHash={termsHash ?? constants.HashZero}
							terms={terms}
							fileName={fileName}
							fileStatus={fileStatus}
							positions={positions}
						/>
					</div>
				</section>

				{/* Action buttons */}
				{!isValidCriteria && (
					<InfoAlert
						className="rounded-md text-sm flex"
						message={t("create.agreementPositions.warning")}
					/>
				)}
				<div className="flex justify-between gap-min3 mt-min2 sm:mt-mt-min3">
					<Button
						label={<div className="flex items-center gap-1">{"Back"}</div>}
						disabled={createLoading || createProcessing}
						bgColor="slate"
						onClick={() => setActiveStep(2)}
					/>
					<Button
						label={
							<div className="flex items-center gap-1">
								{/* <CheckBadgeIcon className="w-5 h-5" /> */}
								{"Create Agreement"}
							</div>
						}
						isLoading={createLoading || createProcessing}
						disabled={createLoading || createProcessing}
						onClick={() => submit()}
					/>
				</div>

				{/* MODAL */}
				<ModalNew
					isOpen={isOpen}
					isClosingDisabled={!isAgreementCreated}
					onClose={() => {
						// router.push(`/agreement/${id}`);
					}}
				>
					<motion.div
						key="modal-content"
						initial={{ opacity: 0, y: +20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: +20 }}
						transition={{ duration: 0.2 }}
						className="flex md:h-auto h-full w-full max-w-md md:m-0 justify-center sm-only:items-end shadow rounded-lg"
						onClick={(e) => {
							e.stopPropagation();
						}}
					>
						<Card size="base" className={cx(createError && "border-2 border-sc-c-orange2")}>
							{/* TODO:   COMPONENTISE */}
							{createError && (
								<div className="flex flex-col gap-base">
									<div className="flex gap-min3">
										<IllustrationRenderer customSize={60} icon={<N3AgreementDone />} size="sm" />
										<div>
											<BodyHeadline color="neutral-c-700" className="mt-min1">
												Something went wrong
											</BodyHeadline>
											<Body3 color="neutral-c-500">Please wait, your wallet will prompt.</Body3>
										</div>
										<Button label="Go back" className="w-full text-neutral-c-600"></Button>
									</div>
								</div>
							)}

							{/* TODO:   COMPONENTISE */}
							{!createSuccess && (
								<div className="flex flex-col gap-base">
									<div className="bg-neutral-c-200 rounded-lg px-base py-double border-2 border-neutral-c-300">
										<AnimationLoader width={200} height={200} animationData={EncryptingAnimation} />
									</div>
									<div className="flex gap-min3">
										<IllustrationRenderer customSize={60} icon={<N3AgreementDone />} size="sm" />
										<div>
											<BodyHeadline color="neutral-c-700" className="mt-min1">
												Preparing Agreement
											</BodyHeadline>
											<Body3 color="neutral-c-500">Please wait, your wallet will prompt.</Body3>
										</div>
									</div>
								</div>
							)}

							{/* TODO:   COMPONENTISE */}
							{createSuccess && (
								<div className="flex flex-col gap-base">
									<div className="bg-neutral-c-200 rounded-lg px-base py-double border-2 border-neutral-c-300">
										<AnimationLoader width={200} height={200} animationData={CompleteAnimation} />
									</div>
									<div className="flex gap-min3">
										<IllustrationRenderer customSize={60} icon={<N3AgreementDone />} size="sm" />
										<div>
											<BodyHeadline color="neutral-c-600" className="mt-min1">
												Your Agreement is live! 🎉
											</BodyHeadline>
											<Body3 color="neutral-c-400">
												Check it and share it with the other parties.
											</Body3>
										</div>
									</div>
									<motion.div
										key="modal-content"
										initial={{ opacity: 0, y: 0, scale: 0.8 }}
										animate={{ opacity: 1, y: 0, scale: 1 }}
										exit={{ opacity: 0, y: 0, scale: 0.8 }}
										transition={{ duration: 0.15 }}
										className="w-full flex justify-end"
										onClick={(e) => {
											router.push(`/agreement/${id}`);
										}}
									>
										<Button
											label="Go to your agreement"
											className="w-full text-neutral-c-600"
										></Button>
									</motion.div>
								</div>
							)}
						</Card>
					</motion.div>
				</ModalNew>
			</article>
		</>
	);
};
