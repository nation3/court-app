import { Tooltip } from "flowbite-react";
import { useMemo, useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { BigNumber, BigNumberish, constants, utils } from "ethers";
// import { useTokenBalance } from "../../../hooks/useToken";
import { useAgreementJoin } from "../../../hooks/useAgreement";
import { frameworkAddress, NATION } from "../../../lib/constants";
import { UserPosition } from "../context/types";
import Image from "next/image";
import { Button, Steps, IStep } from "@nation3/ui-components";
import { Modal as FlowModal } from "flowbite-react";
import courtIcon from "../../../assets/svgs/court.svg";
import nationCoinIcon from "../../../assets/svgs/nation_coin.svg";
import joinedIcon from "../../../assets/svgs/joined.svg";
// import joinedSuccessIcon from "../../../assets/svgs/joined_success.svg";
import { usePermit2Allowance, usePermit2BatchTransferSignature } from "../../../hooks/usePermit2";
import { useTranslation } from "next-i18next";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { Permit2Setup } from "../../Permit2Setup";

const InfoTooltip = ({ info, className }: { info: string; className?: string }) => {
	return (
		<Tooltip style="light" animation="duration-150" content={info}>
			<InformationCircleIcon className={className} />
		</Tooltip>
	);
};

const SummaryBox = ({
	deposit,
	collateral,
}: {
	deposit: BigNumberish;
	collateral: BigNumberish;
}) => {
	const { t } = useTranslation("common");

	return (
		<div className="flex flex-col py-1">
			<p className="flex justify-between gap-5 md:gap-10 px-2 py-1 text-gray-500">
				<span className="text-gray-400">Dispute deposit</span>
				<span className="flex items-center gap-1">
					<span className="font-semibold">{utils.formatUnits(deposit)} $NATION</span>
					<InfoTooltip info={t("agreement.depositInfo")} className="w-4 h-4" />
				</span>
			</p>
			<p className="flex justify-between gap-5 md:gap-10 px-2 py-1 text-gray-500">
				<span className="text-gray-400">Collateral</span>
				<span className="flex items-center gap-1">
					<span className="font-semibold">{utils.formatUnits(collateral)} $NATION</span>
					<InfoTooltip info={t("agreement.collateralInfo")} className="w-4 h-4" />
				</span>
			</p>
		</div>
	);
};

export const JoinableAgreementActions = ({
	id,
	userPosition,
}: {
	id: string;
	userPosition: UserPosition;
}) => {
	const { t } = useTranslation("common");
	const { address } = useAccount();
	// FIXME: Fetch from agreement framework
	const [requiredDeposit] = useState(0);
	const [isJoinAgreementModalOpen, setIsJoinAgreementModalOpen] = useState<boolean>(false);
	const [stepsIndex, setStepsIndex] = useState<number>(0);
	const [isStepLoading, setStepLoading] = useState<boolean>(false);
	const [stepsError, setStepsError] = useState<{
		header: string;
		description: string;
		isError: boolean;
	}>({
		header: "",
		description: "",
		isError: false,
	});

	/* JOIN PRE-REQUIREMENTS */

	const userResolver = useMemo(
		() => ({
			account: address || constants.AddressZero,
			balance: userPosition.resolver?.balance || "0",
			proof: userPosition.resolver?.proof || [],
		}),
		[address, userPosition],
	);

	const requiredCollateral = useMemo((): BigNumber => {
		return BigNumber.from(userPosition.resolver?.balance || 0);
	}, [userPosition]);

	const {
		isEnough: depositTokenApproved,
		approve: approveDepositToken,
		approvalSuccess,
		approvalError,
	} = usePermit2Allowance({
		token: NATION,
		account: address || constants.AddressZero,
	});

	// FIXME: Combine approval for collateral token when != deposit token
	/*
    const {
                        isEnough: collateralTokenApproved,
                    approve: approveCollateralToken
    } = usePermit2Allowance({
                        token: NATION,
                    account: address || constants.AddressZero,
    });
                    */

	// FIXME: Check also required deposit & add pre-step to acquire those tokens
	/*
    const {balance: depositTokenBalance } = useTokenBalance({
                        address: NATION,
                    account: address || constants.AddressZero
    });

                    const {balance: collateralTokenBalance } = useTokenBalance({
                        address: NATION,
                    account: address || constants.AddressZero
    });

    const enoughBalance = useMemo((): boolean => {
        if (depositTokenBalance && collateralTokenBalance) {
            return requiredCollateral.lte(BigNumber.from(collateralTokenBalance));
        } else {
            return false;
        }
    }, [depositTokenBalance, collateralTokenBalance, requiredCollateral]);
                    */

	useEffect(() => {
		if (approvalSuccess || approvalError) {
			setStepLoading(false);
		}
	}, [approvalSuccess, approvalError]);

	/* PERMIT SIGNATURE */

	const { permit, signature, signPermit, signSuccess, signError } =
		usePermit2BatchTransferSignature({
			tokenTransfers: [
				{ token: NATION, amount: requiredDeposit },
				{ token: NATION, amount: requiredCollateral },
			],
			spender: frameworkAddress,
		});

	useEffect(() => {
		// TODO: Built in this logic into the Steps component
		if (signSuccess || signError) {
			setStepLoading(false);
		}
	}, [signSuccess, signError]);

	/* LISTENER APPROVAL EVENT */
	/*
    useEffect(() => {
        if (approvalSuccess) {
                        setStepsIndex(stepsIndex + 1);
                    setStepsLoadingIndex(null);
        } else if (approvalError) {
                        setStepsLoadingIndex(null);
                    setStepsError({
                        header: "Approval failed ⚠️",
                    description:
                    "The process for the initial approval of the $NATION required failed. Please review it and confirm the signing acordingly",
                    isError: true,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [approvalSuccess, approvalError]);
                    */

	/* STEPS 2 - SIGN */

	const { join, isTxSuccess: isJoinSuccess, isError: isJoinError } = useAgreementJoin();

	useEffect(() => {
		if (isJoinSuccess) {
			setStepLoading(false);
			window.location.reload();
		} else if (isJoinError) {
			setStepLoading(false);
			setStepsError({
				header: "Join Agreement failed",
				description: t("join.joinAgreement.error"),
				isError: true,
			});
		}
	}, [isJoinSuccess, isJoinError, t]);

	// FIXME: Better step index selector
	useEffect(() => {
		setStepsIndex(signature ? 1 : 0);
		// TODO: Rethink this, array mode steps are definetly not the best.
		/* 		const manageSteps = [...stepsBase];
        Array.from(Array(index).keys()).forEach(() => {
                        manageSteps.shift();
        }); */
	}, [signature]);

	const steps: IStep[] = [
		{
			title: t("join.permitSignature.title"),
			description: (
				<div>
					<p className="text-xs text-gray-400">{t("join.permitSignature.description")}</p>
				</div>
			),
			image: nationCoinIcon,
			stepCTA: t("join.permitSignature.action") as string,
			action: () => {
				setStepLoading(true);
				signPermit();
			},
		},
		{
			title: t("join.joinAgreement.title"),
			description: (
				<div>
					<p className="text-xs mb-1 text-gray-500">{t("join.joinAgreement.description")}</p>
				</div>
			),
			image: joinedIcon,
			stepCTA: t("join.joinAgreement.action") as string,
			action: () => {
				setStepLoading(true);
				join({ id, resolver: userResolver, permit, signature });
			},
		},
	];

	return (
		<>
			{/* 
			//TODO: Build Global UI Context for generic modals and UI Warns
				TX ERROR MODAL
			*/}
			<FlowModal
				show={stepsError.isError}
				onClose={() => setStepsError({ ...stepsError, isError: false })}
			>
				<FlowModal.Header>{stepsError.header}</FlowModal.Header>
				<FlowModal.Body>
					<div className="space-y-6">
						<p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
							{stepsError.description}
						</p>
					</div>
				</FlowModal.Body>
			</FlowModal>

			<div className="flex flex-col gap-1">
				<Button label="Join Agreement" onClick={() => setIsJoinAgreementModalOpen(true)} />

				<FlowModal
					show={isJoinAgreementModalOpen}
					onClose={() => setIsJoinAgreementModalOpen(false)}
				>
					<FlowModal.Header>
						<div className="flex items-center w-full pl-3">
							{courtIcon && (
								<div className="overflow-hidden flex items-center justify-center h-1/2 mr-6">
									<Image
										className="h-full"
										width={40}
										height={40}
										src={courtIcon}
										alt={"Join Agreemtent"}
									/>
								</div>
							)}
							<h3 className="text-slate-600 md:text-xl text-xl font-semibold">
								{"Join Agreement"}
							</h3>
						</div>
					</FlowModal.Header>
					<div className="flex flex-col items-center justify-center pt-8 border-t-2 border-bluesky-200">
						{depositTokenApproved ? (
							<>
								<div>
									<SummaryBox deposit={requiredDeposit} collateral={requiredCollateral} />
								</div>
								<Steps
									steps={steps}
									icon={courtIcon}
									title={"Join Agreement"}
									stepIndex={stepsIndex}
									isStepLoading={isStepLoading}
								/>
							</>
						) : (
							<Permit2Setup
								tokens={[
									{
										address: NATION,
										name: "NATION",
										isApproved: depositTokenApproved,
										approve: approveDepositToken,
									},
								]}
							/>
						)}
					</div>
				</FlowModal>
			</div>
		</>
	);
};
