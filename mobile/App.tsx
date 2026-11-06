import React, {useMemo, useState} from 'react';
import {
  Alert, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, View,
} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {launchCamera, Asset, CameraOptions} from 'react-native-image-picker';

type Evidence = {uri: string; fileName?: string; type?: string} | null;

const GREEN = '#08A84F';
const DARK = '#073F25';
const MINT = '#E5F8EC';
const TEXT = '#111827';
const MUTED = '#64748B';
const TOTAL = 14;

const labels = [
  'Splash','Welcome / Intro','Permissions','CNIC Front','CNIC Back','CNIC Details',
  'Face Capture','Liveness Check','Face Verification','NADRA SMS Instructions',
  'Fetch SMS','NADRA Response','Verification Processing','Completion',
];

function Logo({small = false}: {small?: boolean}) {
  return (
    <View style={styles.logoRow}>
      <View style={[styles.pin, small && styles.pinSmall]}>
        <View style={[styles.pinHole, small && styles.pinHoleSmall]} />
      </View>
      <Text style={[styles.brand, small && styles.brandSmall]}>Linkin</Text>
    </View>
  );
}

function PrimaryButton({title, onPress, disabled = false}: {
  title: string; onPress: () => void; disabled?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}
      style={({pressed}) => [styles.primaryButton, disabled && styles.disabledButton, pressed && !disabled && styles.pressed]}>
      <Text style={styles.primaryButtonText}>{title}</Text>
    </Pressable>
  );
}

function SecondaryButton({title, onPress}: {title: string; onPress: () => void}) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.secondaryButton}>
    <Text style={styles.secondaryButtonText}>{title}</Text>
  </Pressable>;
}

function Field({label, value, onChangeText, placeholder, keyboardType = 'default', maxLength}: {
  label: string; value: string; onChangeText: (v: string) => void; placeholder: string;
  keyboardType?: 'default' | 'numeric'; maxLength?: number;
}) {
  return <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder}
      placeholderTextColor="#94A3B8" keyboardType={keyboardType} maxLength={maxLength}
      style={styles.input} autoCapitalize="none" />
  </View>;
}

function StepHeader({step, onBack}: {step: number; onBack: () => void}) {
  return <View style={styles.stepHeader}>
    {step > 1 ? <Pressable onPress={onBack} accessibilityLabel="Go back" style={styles.backButton}>
      <Text style={styles.backText}>‹</Text>
    </Pressable> : <View style={styles.backSpacer} />}
    <View style={styles.stepHeaderCenter}>
      <Text style={styles.stepHeaderTitle}>Identity Verification</Text>
      <Text style={styles.stepHeaderSub}>Step {step} of {TOTAL}</Text>
    </View>
    <View style={styles.backSpacer} />
  </View>;
}

function InfoCard({title, children}: {title: string; children: React.ReactNode}) {
  return <View style={styles.infoCard}><Text style={styles.infoTitle}>{title}</Text>{children}</View>;
}

function CapturePanel({title, side, evidence, onCapture, onClear}: {
  title: string; side: 'front' | 'back' | 'face'; evidence: Evidence;
  onCapture: () => void; onClear: () => void;
}) {
  return <View style={styles.captureWrap}>
    <View style={styles.captureFrame}>
      {evidence ? <View style={styles.previewBox}>
        <Text style={styles.previewIcon}>✓</Text>
        <Text style={styles.previewTitle}>Photo captured</Text>
        <Text style={styles.previewCaption}>Image is held locally on this device.</Text>
      </View> : <View style={styles.captureGuide}>
        <View style={styles.cornerTL}/><View style={styles.cornerTR}/>
        <View style={styles.cornerBL}/><View style={styles.cornerBR}/>
        <Text style={styles.captureSymbol}>{side === 'face' ? '◉' : '▤'}</Text>
        <Text style={styles.captureHint}>{side === 'face' ? 'Position your face inside the frame' : 'Fit the complete CNIC inside the frame'}</Text>
      </View>}
    </View>
    {evidence ? <SecondaryButton title="Retake photo" onPress={onClear}/> :
      <PrimaryButton title={title} onPress={onCapture}/>}
  </View>;
}

function AppContent() {
  const [step, setStep] = useState(1);
  const [consent, setConsent] = useState(false);
  const [cnic, setCnic] = useState('');
  const [fullName, setFullName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [dob, setDob] = useState('');
  const [expiry, setExpiry] = useState('');
  const [front, setFront] = useState<Evidence>(null);
  const [back, setBack] = useState<Evidence>(null);
  const [face, setFace] = useState<Evidence>(null);
  const [smsText, setSmsText] = useState('');
  const [livenessAcknowledged, setLivenessAcknowledged] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validCnic = /^\d{5}-?\d{7}-?\d$/.test(cnic);
  const canAdvance = useMemo(() => {
    if (step === 3) return consent;
    if (step === 4) return !!front;
    if (step === 5) return !!back;
    if (step === 6) return validCnic && fullName.trim().length > 1;
    if (step === 7) return !!face;
    if (step === 8) return livenessAcknowledged;
    if (step === 12) return smsText.trim().length > 0;
    return true;
  }, [step, consent, front, back, validCnic, fullName, face, livenessAcknowledged, smsText]);

  const takePhoto = async (target: 'front' | 'back' | 'face') => {
    const options: CameraOptions = {
      mediaType: 'photo',
      cameraType: target === 'face' ? 'front' : 'back',
      saveToPhotos: false,
      quality: 0.85,
      includeBase64: false,
    };
    try {
      const result = await launchCamera(options);
      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert('Camera unavailable', result.errorMessage || 'Please check camera permissions and try again.');
        return;
      }
      const asset: Asset | undefined = result.assets?.[0];
      if (!asset?.uri) {
        Alert.alert('Photo not captured', 'Please try taking the photo again.');
        return;
      }
      const evidence = {uri: asset.uri, fileName: asset.fileName, type: asset.type};
      if (target === 'front') setFront(evidence);
      if (target === 'back') setBack(evidence);
      if (target === 'face') setFace(evidence);
    } catch {
      Alert.alert('Camera error', 'The camera could not be opened on this device.');
    }
  };

  const next = () => {
    if (!canAdvance) {
      Alert.alert('Required information', 'Please complete this step before continuing.');
      return;
    }
    if (step === 13) setSubmitted(true);
    setStep(s => Math.min(TOTAL, s + 1));
  };
  const backStep = () => setStep(s => Math.max(1, s - 1));

  const openSms = async () => {
    if (!validCnic) {
      Alert.alert('Check CNIC number', 'Enter a valid 13-digit CNIC number first.');
      setStep(6);
      return;
    }
    const digits = cnic.replace(/\D/g, '');
    const url = Platform.OS === 'ios'
      ? `sms:7000&body=${encodeURIComponent(digits)}`
      : `sms:7000?body=${encodeURIComponent(digits)}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('SMS app unavailable', 'Please send your CNIC number to 7000 using your phone messaging app.');
    }
  };

  const title = labels[step - 1];
  const body = () => {
    switch (step) {
      case 1:
        return <View style={styles.splash}>
          <View style={styles.splashCenter}><Logo/><Text style={styles.splashSub}>KYC Verification</Text>
            <Text style={styles.splashTag}>Your identity. Our priority.</Text></View>
          <View style={styles.waveOne}/><View style={styles.waveTwo}/>
          <Text style={styles.version}>Linkin KYC · Android</Text>
          <PrimaryButton title="Start verification →" onPress={next}/>
        </View>;
      case 2:
        return <View style={styles.content}>
          <View style={styles.illustration}><Text style={styles.illustrationIcon}>▣</Text><Text style={styles.shield}>✓</Text></View>
          <Text style={styles.heading}>Welcome to Linkin KYC</Text>
          <Text style={styles.paragraph}>We’ll guide you through identity verification using your CNIC, a face photo and an SMS response you request from 7000.</Text>
          <InfoCard title="Before you begin">
            <Bullet text="Keep your original CNIC ready."/>
            <Bullet text="Use a well-lit place for your photos."/>
            <Bullet text="You will review and consent before evidence is submitted."/>
          </InfoCard>
          <View style={styles.flexFill}/><PrimaryButton title="Continue →" onPress={next}/>
        </View>;
      case 3:
        return <View style={styles.content}>
          <View style={styles.largeIcon}><Text style={styles.largeIconText}>♙</Text></View>
          <Text style={styles.heading}>Permissions & Privacy</Text>
          <Text style={styles.paragraph}>Camera access is used to capture your CNIC and face photos. Your information must be handled securely and only for verification.</Text>
          <InfoCard title="Your consent">
            <Bullet text="Camera access when you choose to take a photo."/>
            <Bullet text="Processing of CNIC and face images for identity checks."/>
            <Bullet text="You control when to open your SMS app and send your CNIC to 7000."/>
          </InfoCard>
          <Pressable style={styles.consentRow} onPress={() => setConsent(v => !v)}>
            <View style={[styles.checkbox, consent && styles.checkboxChecked]}>{consent ? <Text style={styles.checkWhite}>✓</Text> : null}</View>
            <Text style={styles.consentText}>I have read and agree to the applicable Terms and Privacy Policy for identity verification.</Text>
          </Pressable>
          <Text style={styles.smallNote}>The final policy versions and server-recorded consent must be configured before production use.</Text>
          <View style={styles.flexFill}/><PrimaryButton title="Continue →" onPress={next} disabled={!consent}/>
        </View>;
      case 4:
      case 5: {
        const isFront = step === 4;
        const evidence = isFront ? front : back;
        return <View style={styles.content}>
          <Text style={styles.heading}>Capture CNIC ({isFront ? 'Front' : 'Back'} Side)</Text>
          <Text style={styles.paragraph}>Take a clear photo of the {isFront ? 'front' : 'back'} side of your original CNIC. Avoid glare and make sure all edges are visible.</Text>
          <CapturePanel title="Open camera" side={isFront ? 'front' : 'back'} evidence={evidence}
            onCapture={() => takePhoto(isFront ? 'front' : 'back')}
            onClear={() => isFront ? setFront(null) : setBack(null)}/>
          <InfoCard title="Photo quality">
            <Bullet text="Place the CNIC on a flat surface."/>
            <Bullet text="Keep the text and photograph in focus."/>
            <Bullet text="Do not crop or cover any information."/>
          </InfoCard>
          <View style={styles.flexFill}/><PrimaryButton title="Continue →" onPress={next} disabled={!evidence}/>
        </View>;
      }
      case 6:
        return <ScrollView contentContainerStyle={styles.contentScroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>CNIC Details</Text>
          <Text style={styles.paragraph}>Review and enter the details exactly as printed on your CNIC. OCR is not connected yet; these fields are entered manually.</Text>
          <Field label="Full name" value={fullName} onChangeText={setFullName} placeholder="As printed on CNIC"/>
          <Field label="Father’s name" value={fatherName} onChangeText={setFatherName} placeholder="Father’s full name"/>
          <Field label="CNIC number" value={cnic} onChangeText={setCnic} placeholder="35202-1234567-1" keyboardType="numeric" maxLength={15}/>
          <Field label="Date of birth" value={dob} onChangeText={setDob} placeholder="DD-MM-YYYY"/>
          <Field label="Expiry date" value={expiry} onChangeText={setExpiry} placeholder="DD-MM-YYYY"/>
          <Text style={styles.smallNote}>CNIC values are kept in app memory for this session only. Do not use real identity data in test builds shared publicly.</Text>
          <PrimaryButton title="Continue →" onPress={next} disabled={!validCnic || fullName.trim().length < 2}/>
        </ScrollView>;
      case 7:
        return <View style={styles.content}>
          <Text style={styles.heading}>Face Capture</Text>
          <Text style={styles.paragraph}>Look directly at the front camera. Remove anything that covers your face and use even lighting.</Text>
          <CapturePanel title="Open front camera" side="face" evidence={face}
            onCapture={() => takePhoto('face')} onClear={() => setFace(null)}/>
          <InfoCard title="Capture guidance"><Bullet text="Keep your full face inside the frame."/><Bullet text="Look directly at the camera."/><Bullet text="Use a plain, well-lit background."/></InfoCard>
          <View style={styles.flexFill}/><PrimaryButton title="Continue →" onPress={next} disabled={!face}/>
        </View>;
      case 8:
        return <View style={styles.content}>
          <View style={styles.largeIcon}><Text style={styles.largeIconText}>◎</Text></View>
          <Text style={styles.heading}>Liveness Check</Text>
          <Text style={styles.paragraph}>A real liveness check requires a configured face-verification provider. That provider is not connected yet, so this screen does not claim that liveness has passed.</Text>
          <InfoCard title="Prepare for the live check">
            <Bullet text="Stay in good lighting."/><Bullet text="Keep your face visible."/><Bullet text="Follow the on-screen movement instructions when the provider is enabled."/>
          </InfoCard>
          <Pressable style={styles.consentRow} onPress={() => setLivenessAcknowledged(v => !v)}>
            <View style={[styles.checkbox, livenessAcknowledged && styles.checkboxChecked]}>{livenessAcknowledged ? <Text style={styles.checkWhite}>✓</Text> : null}</View>
            <Text style={styles.consentText}>I understand that the live liveness check is pending provider integration.</Text>
          </Pressable>
          <View style={styles.flexFill}/><PrimaryButton title="Continue →" onPress={next} disabled={!livenessAcknowledged}/>
        </View>;
      case 9:
        return <View style={styles.content}>
          <View style={styles.largeIcon}><Text style={styles.largeIconText}>✓</Text></View>
          <Text style={styles.heading}>Face Verification</Text>
          <Text style={styles.paragraph}>Your face photo has been captured locally. Face comparison with the CNIC photograph requires the backend verification provider and is not performed on this device.</Text>
          <InfoCard title="Verification status">
            <StatusLine label="Face photo captured" status="Captured"/>
            <StatusLine label="Face comparison" status="Pending provider"/>
            <StatusLine label="Liveness result" status="Pending provider"/>
          </InfoCard>
          <View style={styles.flexFill}/><PrimaryButton title="Continue →" onPress={next}/>
        </View>;
      case 10:
        return <View style={styles.content}>
          <View style={styles.largeIcon}><Text style={styles.largeIconText}>⌁</Text></View>
          <Text style={styles.heading}>NADRA SMS Instructions</Text>
          <Text style={styles.paragraph}>Send your 13-digit CNIC number to 7000 from your own SIM. Your mobile operator may charge for this SMS.</Text>
          <InfoCard title="Message details">
            <Text style={styles.smsNumber}>7000</Text>
            <Text style={styles.smsPreview}>{cnic.replace(/\D/g, '') || 'Enter CNIC on the previous step'}</Text>
          </InfoCard>
          <Text style={styles.smallNote}>This opens your phone’s SMS app. Check the recipient and message, then send it yourself. Linkin does not send it automatically.</Text>
          <SecondaryButton title="Open SMS app" onPress={openSms}/>
          <View style={styles.flexFill}/><PrimaryButton title="I have sent the SMS →" onPress={next}/>
        </View>;
      case 11:
        return <View style={styles.content}>
          <View style={styles.largeIcon}><Text style={styles.largeIconText}>◷</Text></View>
          <Text style={styles.heading}>Waiting for NADRA Response</Text>
          <Text style={styles.paragraph}>After sending the SMS, wait for the reply. SMS User Consent API integration is pending, so paste the received message below for this development build.</Text>
          <Field label="SMS response" value={smsText} onChangeText={setSmsText} placeholder="Paste the SMS response here"/>
          <Text style={styles.smallNote}>Do not paste OTPs or unrelated personal messages. This temporary manual entry is not an authenticated NADRA response.</Text>
          <View style={styles.flexFill}/><PrimaryButton title="Continue →" onPress={next} disabled={!smsText.trim()}/>
        </View>;
      case 12:
        return <View style={styles.content}>
          <View style={styles.largeIcon}><Text style={styles.largeIconText}>✓</Text></View>
          <Text style={styles.heading}>SMS Response Captured</Text>
          <Text style={styles.paragraph}>The response text is present in this session. Its sender and authenticity have not been verified. The backend must validate evidence before using it.</Text>
          <InfoCard title="Evidence status">
            <StatusLine label="SMS text supplied" status="Captured"/>
            <StatusLine label="Sender authenticity" status="Not verified"/>
            <StatusLine label="NADRA issuer validation" status="Not available"/>
          </InfoCard>
          <View style={styles.flexFill}/><PrimaryButton title="Continue →" onPress={next}/>
        </View>;
      case 13:
        return <View style={styles.content}>
          <View style={styles.largeIcon}><Text style={styles.largeIconText}>◌</Text></View>
          <Text style={styles.heading}>Verification Processing</Text>
          <Text style={styles.paragraph}>The mobile evidence collection flow is ready for backend integration. Secure upload, OCR, face/liveness checks and NADRA response verification are not yet available in the KYC API.</Text>
          <InfoCard title="Current integration status">
            <StatusLine label="CNIC photos" status="Local only"/>
            <StatusLine label="OCR and consistency" status="Not connected"/>
            <StatusLine label="Face and liveness" status="Not connected"/>
            <StatusLine label="NADRA SMS evidence" status="Not connected"/>
          </InfoCard>
          <View style={styles.flexFill}/><PrimaryButton title="Finish demo flow →" onPress={next}/>
        </View>;
      case 14:
        return <View style={styles.content}>
          <View style={styles.successMark}><Text style={styles.successCheck}>✓</Text></View>
          <Text style={styles.heading}>{submitted ? 'Submission Flow Complete' : 'KYC Flow Complete'}</Text>
          <Text style={styles.paragraph}>You have reached the end of the mobile demonstration flow. This is not a KYC approval. Your identity remains unverified until the production backend completes all required checks.</Text>
          <InfoCard title="Final status">
            <Text style={styles.pendingPill}>VERIFICATION PENDING</Text>
            <Text style={styles.smallNote}>No verification reference has been issued by the backend.</Text>
          </InfoCard>
          <View style={styles.flexFill}/><PrimaryButton title="Start again" onPress={() => {
            setStep(1); setConsent(false); setCnic(''); setFullName(''); setFatherName('');
            setDob(''); setExpiry(''); setFront(null); setBack(null); setFace(null);
            setSmsText(''); setLivenessAcknowledged(false); setSubmitted(false);
          }}/>
        </View>;
      default: return null;
    }
  };

  if (step === 1) return <View style={styles.root}><StatusBar barStyle="dark-content" backgroundColor="#FFFFFF"/>{body()}</View>;

  return <View style={styles.root}>
    <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF"/>
    <SafeAreaView style={styles.safe} edges={['top','bottom']}>
      <StepHeader step={step} onBack={backStep}/>
      <View style={styles.progressTrack}><View style={[styles.progressFill,{width: `${(step / TOTAL) * 100}%`}]} /></View>
      {body()}
    </SafeAreaView>
  </View>;
}

function Bullet({text}: {text: string}) {
  return <View style={styles.bulletRow}><Text style={styles.bullet}>✓</Text><Text style={styles.bulletText}>{text}</Text></View>;
}
function StatusLine({label,status}: {label:string;status:string}) {
  return <View style={styles.statusLine}><Text style={styles.statusLabel}>{label}</Text><Text style={styles.statusValue}>{status}</Text></View>;
}

export default function App() {
  return <SafeAreaProvider><AppContent/></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  root:{flex:1,backgroundColor:'#FFFFFF'},
  safe:{flex:1,backgroundColor:'#FFFFFF'},
  logoRow:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:12},
  pin:{width:58,height:58,borderRadius:30,backgroundColor:GREEN,alignItems:'center',justifyContent:'center',transform:[{rotate:'-12deg'}]},
  pinSmall:{width:34,height:34,borderRadius:18},
  pinHole:{width:22,height:22,borderRadius:12,backgroundColor:'#FFFFFF'},
  pinHoleSmall:{width:13,height:13},
  brand:{fontSize:48,fontWeight:'800',color:DARK,letterSpacing:-2},
  brandSmall:{fontSize:25},
  splash:{flex:1,alignItems:'center',justifyContent:'space-between',paddingHorizontal:24,paddingTop:70,paddingBottom:30,overflow:'hidden'},
  splashCenter:{alignItems:'center',gap:16},
  splashSub:{fontSize:22,fontWeight:'700',color:TEXT},
  splashTag:{fontSize:15,color:MUTED,marginTop:8},
  waveOne:{position:'absolute',bottom:100,left:-80,right:-80,height:140,backgroundColor:'#DDF7E8',borderTopLeftRadius:180,borderTopRightRadius:180,transform:[{rotate:'-5deg'}],zIndex:-1},
  waveTwo:{position:'absolute',bottom:55,left:-80,right:-80,height:115,backgroundColor:'#A8EAC4',borderTopLeftRadius:140,borderTopRightRadius:140,transform:[{rotate:'4deg'}],zIndex:-1},
  version:{fontSize:12,color:DARK},
  stepHeader:{height:58,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16},
  backButton:{width:40,height:40,alignItems:'center',justifyContent:'center'},
  backText:{fontSize:36,color:DARK,lineHeight:40},
  backSpacer:{width:40},
  stepHeaderCenter:{alignItems:'center'},
  stepHeaderTitle:{fontSize:16,fontWeight:'700',color:DARK},
  stepHeaderSub:{fontSize:11,color:MUTED,marginTop:2},
  progressTrack:{height:4,backgroundColor:'#E8F2EC',marginHorizontal:20,borderRadius:5,overflow:'hidden'},
  progressFill:{height:4,backgroundColor:GREEN,borderRadius:5},
  content:{flex:1,paddingHorizontal:22,paddingTop:22,paddingBottom:18},
  contentScroll:{paddingHorizontal:22,paddingTop:22,paddingBottom:28,gap:14},
  heading:{fontSize:25,fontWeight:'800',color:DARK,textAlign:'center',marginBottom:10,letterSpacing:-0.5},
  paragraph:{fontSize:14,lineHeight:21,color:'#374151',textAlign:'center',marginBottom:20},
  illustration:{height:155,marginBottom:24,borderRadius:30,backgroundColor:MINT,alignItems:'center',justifyContent:'center'},
  illustrationIcon:{fontSize:80,color:GREEN},
  shield:{position:'absolute',right:'28%',top:18,backgroundColor:GREEN,color:'#FFFFFF',fontSize:24,fontWeight:'900',overflow:'hidden',borderRadius:24,padding:9},
  largeIcon:{width:94,height:94,borderRadius:48,backgroundColor:MINT,alignSelf:'center',alignItems:'center',justifyContent:'center',marginBottom:22},
  largeIconText:{fontSize:54,color:GREEN,fontWeight:'600'},
  infoCard:{backgroundColor:'#F6FBF8',borderRadius:16,padding:16,marginBottom:16,borderWidth:1,borderColor:'#E3F4E9'},
  infoTitle:{fontSize:14,fontWeight:'800',color:DARK,marginBottom:12},
  bulletRow:{flexDirection:'row',alignItems:'flex-start',marginBottom:9,gap:9},
  bullet:{width:19,height:19,borderRadius:10,backgroundColor:GREEN,color:'#FFFFFF',textAlign:'center',fontSize:12,fontWeight:'800',overflow:'hidden'},
  bulletText:{flex:1,fontSize:13,lineHeight:19,color:'#334155'},
  consentRow:{flexDirection:'row',alignItems:'flex-start',gap:10,paddingVertical:12},
  checkbox:{width:22,height:22,borderWidth:1.5,borderColor:'#94A3B8',borderRadius:6,alignItems:'center',justifyContent:'center'},
  checkboxChecked:{backgroundColor:GREEN,borderColor:GREEN},
  checkWhite:{fontSize:15,color:'#FFFFFF',fontWeight:'800'},
  consentText:{flex:1,fontSize:13,lineHeight:19,color:'#334155'},
  smallNote:{fontSize:11,lineHeight:16,color:MUTED,marginTop:5,marginBottom:12},
  flexFill:{flex:1,minHeight:12},
  primaryButton:{height:52,backgroundColor:GREEN,borderRadius:15,alignItems:'center',justifyContent:'center',paddingHorizontal:20,marginTop:12},
  primaryButtonText:{color:'#FFFFFF',fontSize:15,fontWeight:'800'},
  disabledButton:{backgroundColor:'#A8CDB7'},
  pressed:{opacity:0.85,transform:[{scale:0.99}]},
  secondaryButton:{height:48,borderRadius:14,borderWidth:1,borderColor:GREEN,alignItems:'center',justifyContent:'center',marginTop:10},
  secondaryButtonText:{color:GREEN,fontSize:14,fontWeight:'700'},
  captureWrap:{alignItems:'center',marginBottom:18},
  captureFrame:{width:'100%',height:220,borderRadius:18,backgroundColor:'#F0FBF4',borderWidth:1,borderColor:'#C9EED7',padding:14,marginBottom:14},
  captureGuide:{flex:1,borderWidth:1,borderColor:'#B4E7C7',borderRadius:12,alignItems:'center',justifyContent:'center'},
  captureSymbol:{fontSize:55,color:'#80C99A'},
  captureHint:{fontSize:12,color:MUTED,marginTop:8,textAlign:'center'},
  cornerTL:{position:'absolute',left:0,top:0,width:22,height:22,borderLeftWidth:3,borderTopWidth:3,borderColor:GREEN,borderTopLeftRadius:5},
  cornerTR:{position:'absolute',right:0,top:0,width:22,height:22,borderRightWidth:3,borderTopWidth:3,borderColor:GREEN,borderTopRightRadius:5},
  cornerBL:{position:'absolute',left:0,bottom:0,width:22,height:22,borderLeftWidth:3,borderBottomWidth:3,borderColor:GREEN,borderBottomLeftRadius:5},
  cornerBR:{position:'absolute',right:0,bottom:0,width:22,height:22,borderRightWidth:3,borderBottomWidth:3,borderColor:GREEN,borderBottomRightRadius:5},
  previewBox:{flex:1,alignItems:'center',justifyContent:'center'},
  previewIcon:{fontSize:42,color:GREEN,fontWeight:'800'},
  previewTitle:{fontSize:15,fontWeight:'800',color:DARK,marginTop:8},
  previewCaption:{fontSize:11,color:MUTED,marginTop:5},
  fieldWrap:{marginBottom:4},
  fieldLabel:{fontSize:13,fontWeight:'700',color:'#334155',marginBottom:7},
  input:{height:48,borderWidth:1,borderColor:'#DCE7E0',borderRadius:12,paddingHorizontal:13,color:TEXT,fontSize:14,backgroundColor:'#FAFCFB'},
  smsNumber:{fontSize:27,fontWeight:'900',color:GREEN,textAlign:'center',marginBottom:8},
  smsPreview:{fontSize:17,color:DARK,textAlign:'center',fontWeight:'700',padding:10,backgroundColor:'#E3F7EB',borderRadius:10},
  statusLine:{flexDirection:'row',justifyContent:'space-between',gap:12,marginBottom:12},
  statusLabel:{fontSize:12,color:'#334155',flex:1},
  statusValue:{fontSize:12,fontWeight:'700',color:'#B45309',textAlign:'right'},
  successMark:{width:88,height:88,borderRadius:44,backgroundColor:GREEN,alignSelf:'center',alignItems:'center',justifyContent:'center',marginBottom:24},
  successCheck:{fontSize:54,color:'#FFFFFF',fontWeight:'800'},
  pendingPill:{alignSelf:'center',paddingVertical:10,paddingHorizontal:16,overflow:'hidden',borderRadius:18,backgroundColor:'#FFF4D6',color:'#8A5A00',fontSize:13,fontWeight:'900',marginBottom:10},
});
